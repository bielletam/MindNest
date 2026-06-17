from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from jose import JWTError, jwt

from app.core.config import settings

_ALGORITHM = "HS256"
_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    return _bcrypt.hashpw(pw_bytes, _bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pw_bytes = plain.encode("utf-8")[:72]
        return _bcrypt.checkpw(pw_bytes, hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=_ALGORITHM,
    )


def decode_access_token(token: str) -> str:
    """Return user_id from a valid token. Raises ValueError on any problem."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[_ALGORITHM])
    except JWTError as exc:
        raise ValueError(f"Invalid or expired token: {exc}") from exc

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise ValueError("Token missing subject claim.")
    return user_id
