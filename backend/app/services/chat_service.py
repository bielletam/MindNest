from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatSession

_TITLE_MAX = 60


def generate_title(first_message: str) -> str:
    """Truncate the first user message to a session title — no LLM call needed."""
    text = first_message.strip()
    if len(text) <= _TITLE_MAX:
        title = text
    else:
        truncated = text[:_TITLE_MAX]
        last_space = truncated.rfind(" ")
        title = truncated[:last_space] if last_space > 0 else truncated
    title = title.rstrip(" .,;:!?-")
    return title or "New chat"


def create_session(
    user_id: str, document_ids: list[str], first_message: str, db: Session
) -> ChatSession:
    session = ChatSession(
        user_id=user_id,
        title=generate_title(first_message),
        document_ids=document_ids,
        message_count=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def save_message(
    session_id: str,
    role: str,
    content: str,
    sources: list[dict] | None,
    db: Session,
) -> ChatMessage:
    message = ChatMessage(session_id=session_id, role=role, content=content, sources=sources)
    db.add(message)

    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if session:
        session.message_count += 1
        session.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(message)
    return message


def list_sessions(user_id: str, db: Session) -> list[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


def search_sessions(user_id: str, query: str, db: Session) -> list[ChatSession]:
    return (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id, ChatSession.title.ilike(f"%{query}%"))
        .order_by(ChatSession.updated_at.desc())
        .all()
    )


def get_session_with_messages(session_id: str, user_id: str, db: Session) -> ChatSession:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session or session.user_id != user_id:
        raise ValueError("Chat session not found.")
    return session


def delete_session(session_id: str, user_id: str, db: Session) -> None:
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session or session.user_id != user_id:
        raise ValueError("Chat session not found.")
    db.delete(session)
    db.commit()
