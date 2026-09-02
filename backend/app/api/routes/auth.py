from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut

router = APIRouter()

_COOKIE = "mn_token"
_MAX_AGE = 60 * 60 * 24 * 7  # 7 days
_IS_PROD = settings.ENVIRONMENT == "production"


def _issue_cookie(response: Response, user_id: str) -> None:
    response.set_cookie(
        key=_COOKIE,
        value=create_access_token(user_id),
        httponly=True,
        samesite="none" if _IS_PROD else "lax",
        secure=_IS_PROD,
        max_age=_MAX_AGE,
        path="/",
    )


@router.post(
    "/auth/signup",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
)
def signup(
    body: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
) -> UserOut:
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )
    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _issue_cookie(response, user.id)
    return user  # type: ignore[return-value]


@router.post(
    "/auth/login",
    response_model=UserOut,
    summary="Sign in and receive a session cookie",
)
def login(
    body: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
) -> UserOut:
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    _issue_cookie(response, user.id)
    return user  # type: ignore[return-value]


@router.post("/auth/logout", summary="Clear the session cookie")
def logout(response: Response) -> dict:
    response.delete_cookie(key=_COOKIE, path="/")
    return {"detail": "Logged out."}


@router.get(
    "/auth/me",
    response_model=UserOut,
    summary="Return the currently authenticated user",
)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return current_user  # type: ignore[return-value]
