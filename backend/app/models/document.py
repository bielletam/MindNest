import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text

from app.db.session import Base


class DocumentStatus(str, PyEnum):
    uploaded = "uploaded"
    extracted = "extracted"
    needs_ocr = "needs_ocr"
    chunked = "chunked"
    chunking_failed = "chunking_failed"


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    extracted_text = Column(Text, nullable=True)
    status = Column(
        Enum(DocumentStatus, values_callable=lambda e: [m.value for m in e]),
        nullable=False,
        default=DocumentStatus.uploaded,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
