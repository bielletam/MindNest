from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.document import Document
from app.models.mindmap import MindMap
from app.models.user import User
from app.schemas.mindmap import (
    GenerateMindMapRequest,
    MindMapOut,
    MindMapWithDataOut,
)
from app.services import mindmap_service

router = APIRouter()


def _owned_doc(document_id: str, current_user: User, db: Session) -> Document:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


def _owned_mindmap(mindmap_id: str, current_user: User, db: Session) -> MindMap:
    mm = db.query(MindMap).filter(MindMap.id == mindmap_id).first()
    if not mm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mind map not found.")
    doc = db.query(Document).filter(Document.id == mm.document_id).first()
    if not doc or doc.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mind map not found.")
    return mm


@router.post(
    "/documents/{document_id}/mindmaps/generate",
    response_model=MindMapWithDataOut,
    status_code=status.HTTP_201_CREATED,
    summary="Generate an AI mind map for a document",
)
def generate_mindmap(
    document_id: str,
    body: GenerateMindMapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MindMapWithDataOut:
    _owned_doc(document_id, current_user, db)
    try:
        mm = mindmap_service.generate_and_save(document_id, body, db)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return mm  # type: ignore[return-value]


@router.get(
    "/documents/{document_id}/mindmaps",
    response_model=list[MindMapOut],
    summary="List all mind maps for a document",
)
def list_mindmaps(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MindMapOut]:
    _owned_doc(document_id, current_user, db)
    return mindmap_service.list_for_document(document_id, db)  # type: ignore[return-value]


@router.get(
    "/mindmaps/{mindmap_id}",
    response_model=MindMapWithDataOut,
    summary="Fetch a mind map with all its nodes and edges",
)
def get_mindmap(
    mindmap_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MindMapWithDataOut:
    mm = _owned_mindmap(mindmap_id, current_user, db)
    return mm  # type: ignore[return-value]


@router.delete(
    "/mindmaps/{mindmap_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a mind map",
)
def delete_mindmap(
    mindmap_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    _owned_mindmap(mindmap_id, current_user, db)
    mindmap_service.delete(mindmap_id, db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
