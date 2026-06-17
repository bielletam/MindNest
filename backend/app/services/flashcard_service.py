from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.schemas.flashcard import FlashcardCreate, FlashcardUpdate, GenerateFlashcardsRequest
from app.services.content_scope_service import get_scoped_content
from app.services.llm_service import generate_flashcards


def generate_and_save(
    document_id: str,
    scope: GenerateFlashcardsRequest,
    db: Session,
) -> list[Flashcard]:
    text, pages = get_scoped_content(
        document_id, scope.page_start, scope.page_end, scope.topic, db
    )
    items = generate_flashcards(text, scope.count, scope.topic)

    flashcards: list[Flashcard] = []
    for item in items:
        fc = Flashcard(
            document_id=document_id,
            front=item["front"],
            back=item["back"],
            source="ai",
            source_pages=pages,
        )
        db.add(fc)
        flashcards.append(fc)

    db.commit()
    for fc in flashcards:
        db.refresh(fc)
    return flashcards


def create_manual(
    document_id: str,
    data: FlashcardCreate,
    db: Session,
) -> Flashcard:
    fc = Flashcard(
        document_id=document_id,
        front=data.front,
        back=data.back,
        source="manual",
        source_pages=None,
    )
    db.add(fc)
    db.commit()
    db.refresh(fc)
    return fc


def update(flashcard_id: str, data: FlashcardUpdate, db: Session) -> Flashcard:
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if fc is None:
        raise ValueError("Flashcard not found.")
    if data.front is not None:
        fc.front = data.front
    if data.back is not None:
        fc.back = data.back
    fc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(fc)
    return fc


def delete(flashcard_id: str, db: Session) -> None:
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if fc:
        db.delete(fc)
        db.commit()


def list_for_document(document_id: str, db: Session) -> list[Flashcard]:
    return (
        db.query(Flashcard)
        .filter(Flashcard.document_id == document_id)
        .order_by(Flashcard.created_at)
        .all()
    )


def update_status(flashcard_id: str, new_status: str, db: Session) -> Flashcard:
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if fc is None:
        raise ValueError("Flashcard not found.")
    fc.status = new_status
    fc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(fc)
    return fc


def reset_all_for_document(document_id: str, db: Session) -> list[Flashcard]:
    """Set every flashcard for this document back to still_learning, regardless of current status."""
    db.query(Flashcard).filter(Flashcard.document_id == document_id).update(
        {
            "status": "still_learning",
            "updated_at": datetime.now(timezone.utc),
        },
        synchronize_session="fetch",
    )
    db.commit()
    return (
        db.query(Flashcard)
        .filter(Flashcard.document_id == document_id)
        .order_by(Flashcard.created_at)
        .all()
    )
