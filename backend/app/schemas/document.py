from datetime import datetime

from pydantic import BaseModel

from app.models.document import DocumentStatus


class DocumentOut(BaseModel):
    id: str
    filename: str
    status: DocumentStatus
    created_at: datetime

    model_config = {"from_attributes": True}
