from sqlalchemy.orm import Session

from app.models.page import Page
from app.models.summary import Summary
from app.services.llm_service import combine_summaries, summarize_chunk

_LENGTH_WORDS: dict[str, int] = {"short": 100, "medium": 250, "detailed": 500}
_BATCH_SIZE = 3          # pages per chunk-summarize batch
_SHORT_DOC_CHARS = 6000  # skip chunk step below this total character count


def summarize_document(document_id: str, length: str, db: Session) -> str:
    target_words = _LENGTH_WORDS.get(length, 250)

    # Return cached result immediately — no LLM call.
    cached = (
        db.query(Summary)
        .filter(Summary.document_id == document_id, Summary.length == length)
        .first()
    )
    if cached:
        return cached.content

    # Fetch pages ordered by page number.
    pages = (
        db.query(Page)
        .filter(Page.document_id == document_id)
        .order_by(Page.page_number)
        .all()
    )
    if not pages:
        raise ValueError(
            "This document hasn't finished processing yet. "
            "Please wait for the upload to complete before summarizing."
        )

    full_text = "\n\n".join(p.content for p in pages)

    if len(full_text) <= _SHORT_DOC_CHARS:
        # Short document: summarize the whole thing in one LLM call.
        final_summary = combine_summaries([full_text], target_words)
    else:
        # Long document: chunk-summarize then combine.
        batches = [pages[i : i + _BATCH_SIZE] for i in range(0, len(pages), _BATCH_SIZE)]
        chunk_summaries: list[str] = []
        for batch in batches:
            batch_text = "\n\n".join(p.content for p in batch)
            chunk_summaries.append(summarize_chunk(batch_text))
        final_summary = combine_summaries(chunk_summaries, target_words)

    # Persist to cache.
    db.add(Summary(document_id=document_id, length=length, content=final_summary))
    db.commit()

    return final_summary
