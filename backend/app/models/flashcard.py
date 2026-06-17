import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, JSON, String, Text

from app.db.session import Base


class FlashcardStatus(str, enum.Enum):
    still_learning = "still_learning"
    know = "know"


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    source = Column(String(16), nullable=False)  # "ai" | "manual"
    source_pages = Column(JSON, nullable=True)   # list[int] | None
    # NOTE: existing rows created before this column will have NULL in SQLite.
    # This project does not use Alembic; recreate the dev database if needed
    # (delete mindnest.db and restart the backend — create_all will rebuild it).
    status = Column(
        String(16),
        nullable=False,
        default=FlashcardStatus.still_learning.value,
        server_default=FlashcardStatus.still_learning.value,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
