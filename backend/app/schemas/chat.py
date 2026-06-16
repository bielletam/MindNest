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
