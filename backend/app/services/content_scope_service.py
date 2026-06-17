from sqlalchemy.orm import Session

from app.models.page import Page
from app.services.embedding_service import embed_texts
from app.services import vectorstore_service

_CHAR_LIMIT = 8000  # TODO: use a batched approach for very long scopes


def get_scoped_content(
    document_id: str,
    page_start: int | None,
    page_end: int | None,
    topic: str | None,
    db: Session,
) -> tuple[str, list[int]]:
    """
    Return (concatenated_text, page_numbers_used) for the requested scope.

    Scope priority:
      1. topic  → vector similarity search against the document's chunks
      2. page range → fetch pages between page_start and page_end inclusive
      3. whole document → all pages
    """
    if topic is not None:
        embedding = embed_texts([topic])[0]
        results = vectorstore_service.query(embedding, [document_id], top_k=10)
        text = "\n".join(r["content"] for r in results)
        pages = sorted({int(r["page_number"]) for r in results})

    elif page_start is not None and page_end is not None:
        rows = (
            db.query(Page)
            .filter(
                Page.document_id == document_id,
                Page.page_number >= page_start,
                Page.page_number <= page_end,
            )
            .order_by(Page.page_number)
            .all()
        )
        if not rows:
            raise ValueError(
                f"No pages found in range {page_start}–{page_end} for this document."
            )
        text = "\n\n".join(p.content for p in rows)
        pages = [p.page_number for p in rows]

    else:
        rows = (
            db.query(Page)
            .filter(Page.document_id == document_id)
            .order_by(Page.page_number)
            .all()
        )
        if not rows:
            raise ValueError(
                "This document has no extracted text yet. "
                "Please wait for processing to complete."
            )
        text = "\n\n".join(p.content for p in rows)
        pages = [p.page_number for p in rows]

    if len(text) > _CHAR_LIMIT:
        text = text[:_CHAR_LIMIT]

    return text, pages
