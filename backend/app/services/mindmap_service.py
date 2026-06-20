from sqlalchemy.orm import Session

from app.models.mindmap import MindMap, MindMapEdge, MindMapNode
from app.schemas.mindmap import GenerateMindMapRequest
from app.services.content_scope_service import get_scoped_content
from app.services.llm_service import generate_mind_map


def _make_title(request: GenerateMindMapRequest) -> str:
    if request.title:
        return request.title
    if request.page_start is not None and request.page_end is not None:
        return f"Pages {request.page_start}–{request.page_end}"
    if request.topic:
        return f"Topic: {request.topic}"
    return "Full Document Map"


def _make_scope_desc(request: GenerateMindMapRequest) -> str:
    if request.page_start is not None and request.page_end is not None:
        return f"Pages {request.page_start}–{request.page_end}"
    if request.topic:
        return f"Topic: {request.topic}"
    return "Whole document"


def generate_and_save(document_id: str, request: GenerateMindMapRequest, db: Session) -> MindMap:
    text, _ = get_scoped_content(
        document_id, request.page_start, request.page_end, request.topic, db
    )
    data = generate_mind_map(text, request.topic)

    mindmap = MindMap(
        document_id=document_id,
        title=_make_title(request),
        scope_description=_make_scope_desc(request),
    )
    db.add(mindmap)
    db.flush()  # populate mindmap.id

    # Map LLM string ids ("n1", "n2", ...) to real UUID-based MindMapNode rows.
    # This is critical: edges must reference real PKs, not the LLM's temporary ids.
    llm_id_to_node: dict[str, MindMapNode] = {}
    for node_data in data["nodes"]:
        node = MindMapNode(
            mindmap_id=mindmap.id,
            label=node_data["label"],
            description=node_data.get("description"),
            node_type=node_data["node_type"],
        )
        db.add(node)
        db.flush()  # populate node.id before referencing it in edges
        llm_id_to_node[node_data["id"]] = node

    for edge_data in data["edges"]:
        src = llm_id_to_node.get(edge_data["source"])
        tgt = llm_id_to_node.get(edge_data["target"])
        if src is None or tgt is None:
            continue
        edge = MindMapEdge(
            mindmap_id=mindmap.id,
            source_node_id=src.id,
            target_node_id=tgt.id,
            relationship_label=edge_data["label"],
        )
        db.add(edge)

    db.commit()
    db.refresh(mindmap)
    return mindmap


def get_with_data(mindmap_id: str, db: Session) -> MindMap:
    mm = db.query(MindMap).filter(MindMap.id == mindmap_id).first()
    if mm is None:
        raise ValueError("Mind map not found.")
    return mm


def list_for_document(document_id: str, db: Session) -> list[MindMap]:
    return (
        db.query(MindMap)
        .filter(MindMap.document_id == document_id)
        .order_by(MindMap.created_at.desc())
        .all()
    )


def delete(mindmap_id: str, db: Session) -> None:
    mm = db.query(MindMap).filter(MindMap.id == mindmap_id).first()
    if mm:
        db.delete(mm)  # cascade="all, delete-orphan" removes edges and nodes
        db.commit()
