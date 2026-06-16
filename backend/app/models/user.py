import uuid

from sqlalchemy import Column, String

from app.db.session import Base


class User(Base):
    """Minimal stub — full implementation comes in the auth milestone."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
