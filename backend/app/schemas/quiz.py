from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class QuizQuestionOut(BaseModel):
    id: str
    quiz_id: str
    question: str
    options: list[str]
    correct_index: int
    explanation: str | None
    source: Literal["ai", "manual"]
    source_pages: list[int] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizOut(BaseModel):
    id: str
    document_id: str
    title: str | None
    scope_description: str | None
    created_at: datetime
    question_count: int

    model_config = {"from_attributes": True}


class QuizWithQuestionsOut(QuizOut):
    questions: list[QuizQuestionOut]


class GenerateQuizRequest(BaseModel):
    page_start: int | None = None
    page_end: int | None = None
    topic: str | None = None
    count: int = Field(default=10, ge=3, le=30)
    title: str | None = None

    @model_validator(mode="after")
    def validate_scope(self) -> "GenerateQuizRequest":
        has_start = self.page_start is not None
        has_end = self.page_end is not None
        has_topic = self.topic is not None

        if has_start != has_end:
            raise ValueError("page_start and page_end must both be provided or both omitted.")

        if (has_start or has_end) and has_topic:
            raise ValueError("Provide either a page range or a topic, not both.")

        return self


class QuizQuestionCreate(BaseModel):
    question: str = Field(..., min_length=1)
    options: list[str] = Field(..., min_length=4, max_length=4)
    correct_index: int = Field(..., ge=0, le=3)
    explanation: str | None = None

    @model_validator(mode="after")
    def validate_options(self) -> "QuizQuestionCreate":
        if len(self.options) != 4:
            raise ValueError("Exactly 4 options are required.")
        for opt in self.options:
            if not opt.strip():
                raise ValueError("All options must be non-empty strings.")
        return self


class QuizQuestionUpdate(BaseModel):
    question: str | None = None
    options: list[str] | None = None
    correct_index: int | None = Field(default=None, ge=0, le=3)
    explanation: str | None = None
