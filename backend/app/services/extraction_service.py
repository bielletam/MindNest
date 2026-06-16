import fitz  # PyMuPDF


def extract_pages(file_path: str) -> list[dict]:
    """Return per-page text as [{"page_number": 1, "text": "..."}, ...]."""
    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        raise ValueError(f"Cannot open PDF: {exc}") from exc
    try:
        pages = [
            {"page_number": i + 1, "text": page.get_text()}
            for i, page in enumerate(doc)
        ]
    finally:
        doc.close()
    return pages


def extract_text(file_path: str) -> str:
    """
    Open a PDF and return all page text joined by newlines.
    Raises ValueError on corrupt/unreadable PDFs so callers can map it to HTTP 400.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as exc:
        raise ValueError(f"Cannot open PDF: {exc}") from exc

    try:
        pages = [page.get_text() for page in doc]
    finally:
        doc.close()

    return "\n".join(pages)


def count_pages(file_path: str) -> int:
    """Return the number of pages in a PDF without extracting text."""
    try:
        doc = fitz.open(file_path)
        n = doc.page_count
        doc.close()
        return max(n, 1)
    except Exception:
        return 1
