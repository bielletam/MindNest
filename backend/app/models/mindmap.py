import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class MindMap(Base):
    __tablename__ = "mindmaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    scope_description = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    nodes = relationship(
        "MindMapNode",
        back_populates="mindmap",
        cascade="all, delete-orphan",
        lazy="selectin",
        foreign_keys="MindMapNode.mindmap_id",
    )
    edges = relationship(
        "MindMapEdge",
        back_populates="mindmap",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def node_count(self) -> int:
        return len(self.nodes)

    @property
    def edge_count(self) -> int:
        return len(self.edges)


class MindMapNode(Base):
    __tablename__ = "mindmap_nodes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mindmap_id = Column(String(36), ForeignKey("mindmaps.id"), nullable=False, index=True)
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    node_type = Column(String(16), nullable=False)  # "root" | "branch" | "leaf"
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    mindmap = relationship("MindMap", back_populates="nodes", foreign_keys=[mindmap_id])


class MindMapEdge(Base):
    __tablename__ = "mindmap_edges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mindmap_id = Column(String(36), ForeignKey("mindmaps.id"), nullable=False, index=True)
    source_node_id = Column(String(36), ForeignKey("mindmap_nodes.id"), nullable=False)
    target_node_id = Column(String(36), ForeignKey("mindmap_nodes.id"), nullable=False)
    relationship_label = Column(String(128), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    mindmap = relationship("MindMap", back_populates="edges")
