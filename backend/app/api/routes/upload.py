import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.models.chunk import Chunk
from app.models.document import Document, DocumentStatus
from app.models.page import Page
from app.models.user import User
from app.schemas.document import DocumentOut
from app.services import vectorstore_service
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import embed_texts
from app.services.extraction_service import count_pages, extract_pages, extract_text

router = APIRouter()

_OCR_THRESHOLD = 20


def _is_pdf(file: UploadFile) -> bool:
    by_mime = (file.content_type or "").lower() == "application/pdf"
    by_name = (file.filename or "").lower().endswith(".pdf")
    return by_mime or by_name


@router.post(
    "/upload",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF document",
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentOut:
    if not _is_pdf(file):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted (check Content-Type or filename).",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / f"{uuid.uuid4()}.pdf"

    try:
        content = await file.read()
        dest.write_bytes(content)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {exc}",
        )

    doc = Document(
        user_id=current_user.id,
        filename=file.filename or dest.name,
        storage_path=str(dest),
        status=DocumentStatus.uploaded,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        text = extract_text(str(dest))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PDF parsing failed: {exc}",
        )

    pages_count = count_pages(str(dest))
    chars_per_page = len(text) / pages_count

    if not text.strip() or chars_per_page < _OCR_THRESHOLD:
        doc.status = DocumentStatus.needs_ocr
    else:
        doc.extracted_text = text
        doc.status = DocumentStatus.extracted

    db.commit()
    db.refresh(doc)

    if doc.status == DocumentStatus.extracted:
        try:
            pages = extract_pages(str(dest))

            for p in pages:
                if p["text"].strip():
                    db.add(Page(
                        document_id=doc.id,
                        page_number=p["page_number"],
                        content=p["text"],
                    ))
            db.commit()

            chunks = chunk_pages(pages)
            if chunks:
                texts = [c["content"] for c in chunks]
                embeddings = embed_texts(texts)

                for c in chunks:
                    db.add(Chunk(
                        document_id=doc.id,
                        page_number=c["page_number"],
                        content=c["content"],
                        chunk_index=c["chunk_index"],
                    ))
                db.commit()
                vectorstore_service.add_chunks(doc.id, chunks, embeddings)

            doc.status = DocumentStatus.chunked
            db.commit()
            db.refresh(doc)

        except Exception:
            doc.status = DocumentStatus.chunking_failed
            db.commit()
            db.refresh(doc)

    return doc  # type: ignore[return-value]
