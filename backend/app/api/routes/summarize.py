from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.services.summarization_service import summarize_document

router = APIRouter()

_VALID_LENGTHS = {"short", "medium", "detailed"}


class SummarizeRequest(BaseModel):
    length: str = "medium"


class SummarizeResponse(BaseModel):
    summary: str
    length: str


@router.post(
    "/documents/{document_id}/summarize",
    response_model=SummarizeResponse,
    summary="Generate (or return cached) summary for a document",
)
def summarize(
    document_id: str,
    body: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SummarizeResponse:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if body.length not in _VALID_LENGTHS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="length must be 'short', 'medium', or 'detailed'.",
        )

    try:
        content = summarize_document(document_id, body.length, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return SummarizeResponse(summary=content, length=body.length)
