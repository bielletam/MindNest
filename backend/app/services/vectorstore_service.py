from pathlib import Path

import chromadb

from app.core.config import settings

_collection = None


def _get_collection() -> chromadb.Collection:
    global _collection
    if _collection is None:
        Path(settings.CHROMA_DIR).mkdir(parents=True, exist_ok=True)
        client = chromadb.PersistentClient(path=settings.CHROMA_DIR)
        _collection = client.get_or_create_collection(
            name="mindnest_chunks",
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(
    document_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
) -> None:
    """Store chunk content + embeddings in ChromaDB, keyed by document_id/chunk_index."""
    collection = _get_collection()
    collection.add(
        ids=[f"{document_id}_{c['chunk_index']}" for c in chunks],
        embeddings=embeddings,
        documents=[c["content"] for c in chunks],
        metadatas=[
            {
                "document_id": document_id,
                "page_number": c["page_number"],
                "chunk_index": c["chunk_index"],
            }
            for c in chunks
        ],
    )


def query(
    query_embedding: list[float],
    document_ids: list[str],
    top_k: int = 5,
) -> list[dict]:
    """
    Return the top_k most similar chunks filtered to the given document_ids.
    Each result: {"content", "document_id", "page_number", "score"}
    """
    if not document_ids:
        return []

    collection = _get_collection()

    where = (
        {"document_id": document_ids[0]}
        if len(document_ids) == 1
        else {"document_id": {"$in": document_ids}}
    )

    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
    except Exception:
        # Collection may have fewer items than top_k — return empty list gracefully.
        return []

    output: list[dict] = []
    for doc, meta, dist in zip(
        results["documents"][0],
        results["metadatas"][0],
        results["distances"][0],
    ):
        output.append(
            {
                "content": doc,
                "document_id": meta["document_id"],
                "page_number": meta["page_number"],
                # Cosine distance → similarity score (0–1)
                "score": round(1.0 - float(dist), 4),
            }
        )

    return output
