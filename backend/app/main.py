from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import auth, chat, documents, flashcards, mindmap, quiz, summarize, upload
from app.db.session import Base, engine

# Register all models so create_all sees every table.
import app.models.user  # noqa: F401
import app.models.document  # noqa: F401
import app.models.chunk  # noqa: F401
import app.models.page  # noqa: F401
import app.models.summary  # noqa: F401
import app.models.flashcard  # noqa: F401
import app.models.quiz  # noqa: F401
import app.models.mindmap  # noqa: F401
import app.models.chat  # noqa: F401


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Inline migration: add the status column to databases that predate it.
    # ALTER TABLE is a no-op (caught and ignored) if the column already exists.
    with engine.connect() as conn:
        try:
            conn.execute(
                text(
                    "ALTER TABLE flashcards ADD COLUMN status VARCHAR(16) "
                    "NOT NULL DEFAULT 'still_learning'"
                )
            )
            conn.commit()
        except Exception:
            pass  # column already present — nothing to do
    yield


app = FastAPI(title="MindNest API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(summarize.router, prefix="/api/v1")
app.include_router(flashcards.router, prefix="/api/v1")
app.include_router(quiz.router, prefix="/api/v1")
app.include_router(mindmap.router, prefix="/api/v1")
