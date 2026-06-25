from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    document_ids: list[str] = Field(..., min_length=1)


class Source(BaseModel):
    document_id: str
    page_number: int


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]


# ─── Chat sessions ──────────────────────────────────────────────────────────────


class ChatSessionOut(BaseModel):
    id: str
    title: str
    document_ids: list[str]
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    role: Literal["user", "assistant"]
    content: str
    sources: list[Source] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionWithMessagesOut(ChatSessionOut):
    messages: list[ChatMessageOut]


class CreateSessionRequest(BaseModel):
    document_ids: list[str] = Field(..., min_length=1)
    first_message: str = Field(..., min_length=1)


class SendMessageRequest(BaseModel):
    query: str = Field(..., min_length=1)
