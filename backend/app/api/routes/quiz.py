from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.quiz import Quiz, QuizQuestion
from app.models.user import User
from app.schemas.quiz import (
    GenerateQuizRequest,
    QuizOut,
    QuizQuestionCreate,
    QuizQuestionOut,
    QuizQuestionUpdate,
    QuizWithQuestionsOut,
)
from app.services import quiz_service

router = APIRouter()


def _owned_doc(document_id: str, current_user: User, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


def _owned_quiz(quiz_id: str, current_user: User, db: Session) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    doc = db.query(Document).filter(Document.id == quiz.document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    return quiz


def _owned_question(question_id: str, current_user: User, db: Session) -> QuizQuestion:
    q = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    quiz = db.query(Quiz).filter(Quiz.id == q.quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    doc = db.query(Document).filter(Document.id == quiz.document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")
    return q


@router.post(
    "/documents/{document_id}/quizzes/generate",
    response_model=QuizWithQuestionsOut,
    status_code=status.HTTP_201_CREATED,
    summary="Generate an AI quiz for a document",
)
def generate_quiz(
    document_id: str,
    body: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizWithQuestionsOut:
    _owned_doc(document_id, current_user, db)
    try:
        quiz = quiz_service.generate_and_save(document_id, body, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return quiz  # type: ignore[return-value]


@router.get(
    "/documents/{document_id}/quizzes",
    response_model=list[QuizOut],
    summary="List all quizzes for a document",
)
def list_quizzes(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[QuizOut]:
    _owned_doc(document_id, current_user, db)
    return quiz_service.list_for_document(document_id, db)  # type: ignore[return-value]


@router.get(
    "/quizzes/{quiz_id}",
    response_model=QuizWithQuestionsOut,
    summary="Fetch a quiz with all its questions",
)
def get_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizWithQuestionsOut:
    quiz = _owned_quiz(quiz_id, current_user, db)
    return quiz  # type: ignore[return-value]


@router.delete(
    "/quizzes/{quiz_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a quiz and all its questions",
)
def delete_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _owned_quiz(quiz_id, current_user, db)
    quiz_service.delete_quiz(quiz_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuizQuestionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Manually add a question to a quiz",
)
def create_question(
    quiz_id: str,
    body: QuizQuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizQuestionOut:
    _owned_quiz(quiz_id, current_user, db)
    q = quiz_service.create_manual_question(quiz_id, body, db)
    return q  # type: ignore[return-value]


@router.patch(
    "/questions/{question_id}",
    response_model=QuizQuestionOut,
    summary="Edit a quiz question",
)
def update_question(
    question_id: str,
    body: QuizQuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuizQuestionOut:
    _owned_question(question_id, current_user, db)
    try:
        q = quiz_service.update_question(question_id, body, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    return q  # type: ignore[return-value]


@router.delete(
    "/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a quiz question",
)
def delete_question(
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _owned_question(question_id, current_user, db)
    quiz_service.delete_question(question_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
