from sentence_transformers import SentenceTransformer

# Loaded once at startup — ~80 MB, no API key required.
_MODEL = SentenceTransformer("all-MiniLM-L6-v2")


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Return a list of 384-dimensional embedding vectors, one per input text."""
    embeddings = _MODEL.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return [e.tolist() for e in embeddings]
