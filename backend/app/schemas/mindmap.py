from datetime import datetime
from typing import Literal

from pydantic import BaseModel, model_validator


class MindMapNodeOut(BaseModel):
    id: str
    label: str
    description: str | None
    node_type: Literal["root", "branch", "leaf"]

    model_config = {"from_attributes": True}


class MindMapEdgeOut(BaseModel):
    id: str
    source_node_id: str
    target_node_id: str
    relationship_label: str

    model_config = {"from_attributes": True}


class MindMapOut(BaseModel):
    id: str
    document_id: str
    title: str | None
    scope_description: str | None
    created_at: datetime
    node_count: int
    edge_count: int

    model_config = {"from_attributes": True}


class MindMapWithDataOut(MindMapOut):
    nodes: list[MindMapNodeOut]
    edges: list[MindMapEdgeOut]


class GenerateMindMapRequest(BaseModel):
    page_start: int | None = None
    page_end: int | None = None
    topic: str | None = None
    title: str | None = None

    @model_validator(mode="after")
    def validate_scope(self) -> "GenerateMindMapRequest":
        has_start = self.page_start is not None
        has_end = self.page_end is not None
        has_topic = self.topic is not None

        if has_start != has_end:
            raise ValueError("page_start and page_end must both be provided or both omitted.")
        if (has_start or has_end) and has_topic:
            raise ValueError("Provide either a page range or a topic, not both.")
        return self
