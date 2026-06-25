from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.chat import (
    ChatMessageOut,
    ChatRequest,
    ChatResponse,
    ChatSessionOut,
    ChatSessionWithMessagesOut,
    CreateSessionRequest,
    SendMessageRequest,
)
from app.services import chat_service
from app.services.rag_service import answer_question

router = APIRouter()


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Ask a question about one or more uploaded documents",
)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    for doc_id in request.document_ids:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc or doc.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Document '{doc_id}' not found or access denied.",
            )

    result = answer_question(request.query, request.document_ids)
    return ChatResponse(**result)


# ─── Chat sessions ──────────────────────────────────────────────────────────────


def _owned_documents(document_ids: list[str], current_user: User, db: Session) -> None:
    for doc_id in document_ids:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc or doc.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document '{doc_id}' not found.",
            )


@router.post(
    "/chat/sessions",
    response_model=ChatSessionWithMessagesOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new chat session and answer its first message",
)
def create_chat_session(
    body: CreateSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatSessionWithMessagesOut:
    _owned_documents(body.document_ids, current_user, db)

    session = chat_service.create_session(current_user.id, body.document_ids, body.first_message, db)
    chat_service.save_message(session.id, "user", body.first_message, None, db)

    result = answer_question(body.first_message, body.document_ids)
    chat_service.save_message(session.id, "assistant", result["answer"], result["sources"], db)

    return chat_service.get_session_with_messages(session.id, current_user.id, db)  # type: ignore[return-value]


@router.post(
    "/chat/sessions/{session_id}/messages",
    response_model=ChatMessageOut,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message to an existing chat session",
)
def send_chat_message(
    session_id: str,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatMessageOut:
    try:
        session = chat_service.get_session_with_messages(session_id, current_user.id, db)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")

    chat_service.save_message(session_id, "user", body.query, None, db)

    result = answer_question(body.query, session.document_ids)
    assistant_message = chat_service.save_message(
        session_id, "assistant", result["answer"], result["sources"], db
    )

    return assistant_message  # type: ignore[return-value]


@router.get(
    "/chat/sessions",
    response_model=list[ChatSessionOut],
    summary="List the current user's chat sessions",
)
def get_chat_sessions(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatSessionOut]:
    if search:
        return chat_service.search_sessions(current_user.id, search, db)  # type: ignore[return-value]
    return chat_service.list_sessions(current_user.id, db)  # type: ignore[return-value]


@router.get(
    "/chat/sessions/{session_id}",
    response_model=ChatSessionWithMessagesOut,
    summary="Fetch a chat session with its full message history",
)
def get_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatSessionWithMessagesOut:
    try:
        return chat_service.get_session_with_messages(session_id, current_user.id, db)  # type: ignore[return-value]
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")


@router.delete(
    "/chat/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a chat session",
)
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    try:
        chat_service.delete_session(session_id, current_user.id, db)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
