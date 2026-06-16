from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.page import Page
from app.schemas.page import PageOut

router = APIRouter()


@router.get(
    "/documents/{document_id}/pages/{page_number}",
    response_model=PageOut,
    summary="Fetch the text of one page of a document",
)
def get_page(
    document_id: str,
    page_number: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> PageOut:
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
