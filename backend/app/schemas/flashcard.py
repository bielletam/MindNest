from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class FlashcardOut(BaseModel):
    id: str
    front: str
    back: str
    source: str
    source_pages: list[int] | None
    status: Literal["still_learning", "know"]
    created_at: datetime

    model_config = {"from_attributes": True}


class FlashcardCreate(BaseModel):
    front: str = Field(..., min_length=1)
    back: str = Field(..., min_length=1)


class FlashcardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None


class FlashcardStatusUpdate(BaseModel):
    status: Literal["still_learning", "know"]


class GenerateFlashcardsRequest(BaseModel):
    page_start: int | None = None
    page_end: int | None = None
    topic: str | None = None
    count: int = Field(default=10, ge=1, le=30)

    @model_validator(mode="after")
    def validate_scope(self) -> "GenerateFlashcardsRequest":
        has_page_start = self.page_start is not None
        has_page_end = self.page_end is not None
        has_topic = self.topic is not None

        if has_page_start != has_page_end:
            raise ValueError("page_start and page_end must both be provided or both omitted.")

        if (has_page_start or has_page_end) and has_topic:
            raise ValueError("Provide either a page range or a topic, not both.")

        return self
