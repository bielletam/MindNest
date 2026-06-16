def chunk_pages(
    pages: list[dict],
    chunk_size: int = 800,
    overlap: int = 100,
) -> list[dict]:
    """
    Split page-level text into overlapping fixed-size chunks.

    Input:  [{"page_number": 1, "text": "..."}, ...]
    Output: [{"content": "...", "page_number": 1, "chunk_index": 0}, ...]
    """
    chunks: list[dict] = []
    chunk_index = 0

    for page in pages:
        text: str = page["text"].strip()
        if not text:
            continue

        page_number: int = page["page_number"]
        start = 0

        while start < len(text):
            end = start + chunk_size
            content = text[start:end].strip()
            if content:
                chunks.append(
                    {
                        "content": content,
                        "page_number": page_number,
                        "chunk_index": chunk_index,
                    }
                )
                chunk_index += 1
            if end >= len(text):
                break
            start += chunk_size - overlap

    return chunks
