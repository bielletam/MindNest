from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.quiz import Quiz, QuizQuestion
from app.schemas.quiz import GenerateQuizRequest, QuizQuestionCreate, QuizQuestionUpdate
from app.services.content_scope_service import get_scoped_content
from app.services.llm_service import generate_quiz_questions


def _make_title(request: GenerateQuizRequest) -> str:
    if request.title:
        return request.title
    if request.page_start is not None and request.page_end is not None:
        return f"Pages {request.page_start}–{request.page_end}"
    if request.topic:
        return f"Topic: {request.topic}"
    return "Full Document Quiz"


def _make_scope_desc(request: GenerateQuizRequest) -> str:
    if request.page_start is not None and request.page_end is not None:
        return f"Pages {request.page_start}–{request.page_end}"
    if request.topic:
        return f"Topic: {request.topic}"
    return "Whole document"


def generate_and_save(document_id: str, request: GenerateQuizRequest, db: Session) -> Quiz:
    text, pages = get_scoped_content(
        document_id, request.page_start, request.page_end, request.topic, db
    )
    items = generate_quiz_questions(text, request.count, request.topic)

    quiz = Quiz(
        document_id=document_id,
        title=_make_title(request),
        scope_description=_make_scope_desc(request),
    )
    db.add(quiz)
    db.flush()

    for item in items:
        q = QuizQuestion(
            quiz_id=quiz.id,
            question=item["question"],
            options=item["options"],
            correct_index=item["correct_index"],
            explanation=item.get("explanation"),
            source="ai",
            source_pages=pages,
        )
        db.add(q)

    db.commit()
    db.refresh(quiz)
    return quiz


def get_quiz_with_questions(quiz_id: str, db: Session) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz is None:
        raise ValueError("Quiz not found.")
    return quiz


def list_for_document(document_id: str, db: Session) -> list[Quiz]:
    return (
        db.query(Quiz)
        .filter(Quiz.document_id == document_id)
        .order_by(Quiz.created_at.desc())
        .all()
    )


def create_manual_question(quiz_id: str, data: QuizQuestionCreate, db: Session) -> QuizQuestion:
    q = QuizQuestion(
        quiz_id=quiz_id,
        question=data.question,
        options=data.options,
        correct_index=data.correct_index,
        explanation=data.explanation,
        source="manual",
        source_pages=None,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


def update_question(question_id: str, data: QuizQuestionUpdate, db: Session) -> QuizQuestion:
    q = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if q is None:
        raise ValueError("Question not found.")
    if data.question is not None:
        q.question = data.question
    if data.options is not None:
        q.options = data.options
    if data.correct_index is not None:
        q.correct_index = data.correct_index
    if data.explanation is not None:
        q.explanation = data.explanation
    q.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(q)
    return q


def delete_question(question_id: str, db: Session) -> None:
    q = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if q:
        db.delete(q)
        db.commit()


def delete_quiz(quiz_id: str, db: Session) -> None:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if quiz:
        db.delete(quiz)  # cascade="all, delete-orphan" removes questions
        db.commit()
