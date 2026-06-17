from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.flashcard import Flashcard
from app.models.user import User
from app.schemas.flashcard import (
    FlashcardCreate,
    FlashcardOut,
    FlashcardStatusUpdate,
    FlashcardUpdate,
    GenerateFlashcardsRequest,
)
from app.services import flashcard_service

router = APIRouter()


def _owned_doc(document_id: str, current_user: User, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


def _owned_flashcard(flashcard_id: str, current_user: User, db: Session) -> Flashcard:
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not fc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")
    doc = db.query(Document).filter(Document.id == fc.document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")
    return fc


@router.post(
    "/documents/{document_id}/flashcards/generate",
    response_model=list[FlashcardOut],
    status_code=status.HTTP_201_CREATED,
    summary="Generate AI flashcards for a document",
)
def generate(
    document_id: str,
    body: GenerateFlashcardsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FlashcardOut]:
    _owned_doc(document_id, current_user, db)
    try:
        cards = flashcard_service.generate_and_save(document_id, body, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return cards  # type: ignore[return-value]


@router.post(
    "/documents/{document_id}/flashcards/reset",
    response_model=list[FlashcardOut],
    summary="Reset all flashcard study statuses to still_learning",
)
def reset_flashcards(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FlashcardOut]:
    _owned_doc(document_id, current_user, db)
    return flashcard_service.reset_all_for_document(document_id, db)  # type: ignore[return-value]


@router.get(
    "/documents/{document_id}/flashcards",
    response_model=list[FlashcardOut],
    summary="List all flashcards for a document",
)
def list_flashcards(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[FlashcardOut]:
    _owned_doc(document_id, current_user, db)
    return flashcard_service.list_for_document(document_id, db)  # type: ignore[return-value]


@router.post(
    "/documents/{document_id}/flashcards",
    response_model=FlashcardOut,
    status_code=status.HTTP_201_CREATED,
    summary="Manually create a flashcard",
)
def create_flashcard(
    document_id: str,
    body: FlashcardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlashcardOut:
    _owned_doc(document_id, current_user, db)
    return flashcard_service.create_manual(document_id, body, db)  # type: ignore[return-value]


@router.patch(
    "/flashcards/{flashcard_id}/status",
    response_model=FlashcardOut,
    summary="Update the study status of a flashcard",
)
def update_flashcard_status(
    flashcard_id: str,
    body: FlashcardStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlashcardOut:
    _owned_flashcard(flashcard_id, current_user, db)
    try:
        updated = flashcard_service.update_status(flashcard_id, body.status, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return updated  # type: ignore[return-value]


@router.patch(
    "/flashcards/{flashcard_id}",
    response_model=FlashcardOut,
    summary="Update front/back of a flashcard",
)
def update_flashcard(
    flashcard_id: str,
    body: FlashcardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FlashcardOut:
    fc = _owned_flashcard(flashcard_id, current_user, db)
    try:
        updated = flashcard_service.update(fc.id, body, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return updated  # type: ignore[return-value]


@router.delete(
    "/flashcards/{flashcard_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a flashcard",
)
def delete_flashcard(
    flashcard_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _owned_flashcard(flashcard_id, current_user, db)
    flashcard_service.delete(flashcard_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
