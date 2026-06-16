from app.services.embedding_service import embed_texts
from app.services.llm_service import generate
from app.services import vectorstore_service

_PROMPT_TEMPLATE = """\
You are a study assistant. Answer the question using ONLY the context provided below.
If the answer is not contained in the context, respond with:
"I don't have enough information in the provided documents to answer that."

Context:
{context}

Question: {question}

Answer:"""


def answer_question(query: str, document_ids: list[str]) -> dict:
    """
    Embed the query, retrieve relevant chunks, call the LLM, return answer + sources.

    Returns:
        {"answer": str, "sources": [{"document_id": str, "page_number": int}, ...]}
    """
    [query_embedding] = embed_texts([query])
    chunks = vectorstore_service.query(query_embedding, document_ids, top_k=5)

    if not chunks:
        return {
            "answer": "I don't have enough information in the provided documents to answer that.",
            "sources": [],
        }

    context = "\n\n".join(
        f"[Page {c['page_number']}] {c['content']}" for c in chunks
    )
    prompt = _PROMPT_TEMPLATE.format(context=context, question=query)
    answer = generate(prompt)

    seen: set[tuple] = set()
    sources: list[dict] = []
    for c in chunks:
        key = (c["document_id"], c["page_number"])
        if key not in seen:
            seen.add(key)
            sources.append(
                {"document_id": c["document_id"], "page_number": c["page_number"]}
            )

    return {"answer": answer, "sources": sources}
