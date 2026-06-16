from typing import Optional

from fastapi import Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db  # re-export so routes can import from one place


async def get_current_user(x_user_id: Optional[str] = Header(default=None)) -> Optional[dict]:
    """
    Minimal development auth — reads an X-User-Id header.
    Replace with JWT verification in the auth milestone.
    """
    if x_user_id is None:
        return None
    return {"id": x_user_id}


async def require_current_user(
    x_user_id: Optional[str] = Header(default=None),
) -> dict:
    """Same as get_current_user but raises 401 when the header is absent."""
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Send X-User-Id header.",
        )
    return {"id": x_user_id}
