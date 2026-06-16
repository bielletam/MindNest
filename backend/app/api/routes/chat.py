from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import require_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import answer_question

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask a question about one or more uploaded documents",
)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(require_current_user),
) -> ChatResponse:
    if not request.document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document_id is required.",
        )

    result = answer_question(request.query, request.document_ids)
    return ChatResponse(**result)
