from pydantic import BaseModel


class PageOut(BaseModel):
    document_id: str
    page_number: int
    content: str
    total_pages: int
