from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.flashcard import Flashcard
from app.models.page import Page
from app.models.user import User
from app.schemas.document import DocumentOut
from app.schemas.page import PageOut

router = APIRouter()


@router.get(
    "/documents",
    response_model=list[DocumentOut],
    summary="List all documents belonging to the current user",
)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentOut]:
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return docs  # type: ignore[return-value]


@router.get(
    "/documents/{document_id}/pages/{page_number}",
    response_model=PageOut,
    summary="Fetch the text of one page of a document",
)
def get_page(
    document_id: str,
    page_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PageOut:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    page = (
        db.query(Page)
        .filter(
            Page.document_id == document_id,
            Page.page_number == page_number,
        )
        .first()
    )
    if not page:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Page not found.",
        )

    total: int = (
        db.query(func.count(Page.id))
        .filter(Page.document_id == document_id)
        .scalar()
        or 0
    )

    return PageOut(
        document_id=page.document_id,
        page_number=page.page_number,
        content=page.content,
        total_pages=int(total),
    )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a document and all its pages and flashcards",
)
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    db.query(Flashcard).filter(Flashcard.document_id == document_id).delete()
    db.query(Page).filter(Page.document_id == document_id).delete()
    db.delete(doc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
