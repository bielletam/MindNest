import json
import re

from groq import Groq

from app.core.config import settings

_MODEL = "openai/gpt-oss-20b"


def _chat(messages: list[dict], max_tokens: int = 1024) -> str:
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model=_MODEL,
        messages=messages,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


def generate(prompt: str) -> str:
    """Send a prompt to Groq and return the text response."""
    return _chat(
        [
            {
                "role": "system",
                "content": (
                    "You are a study assistant answering questions about a student's "
                    "documents. Format responses in clean, standard Markdown: use "
                    "paragraphs, '-' bullet lists, and '|' tables where they genuinely "
                    "help. Never use raw HTML tags such as <br> — use blank lines or "
                    "Markdown syntax for spacing and line breaks instead."
                ),
            },
            {"role": "user", "content": prompt},
        ]
    )


def summarize_chunk(text: str) -> str:
    """Summarize one chunk (a few pages) of a document in 2-4 sentences."""
    return _chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an academic summarization assistant. You summarize only the "
                    "content given to you. Never add outside facts, opinions, or information "
                    "not present in the source text. Preserve specific numbers, names, dates, "
                    "and technical terms exactly as written."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Summarize the following excerpt from a larger document in 2-4 sentences. "
                    "Focus only on the main ideas and key facts — skip examples, repetition, "
                    "and filler.\n\n"
                    f"Excerpt:\n{text}\n\n"
                    "Return only the summary. No preamble, no labels, no commentary."
                ),
            },
        ],
        max_tokens=256,
    )


def generate_flashcards(text: str, count: int, topic: str | None) -> list[dict]:
    """Generate flashcard dicts [{front, back}, ...] from source text."""
    topic_line = f" Focus specifically on the topic: {topic}." if topic else ""
    raw = _chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an academic flashcard generator. You create flashcards only "
                    "from the content given to you. Never introduce facts not present in "
                    "the source text. Each flashcard should test one clear, specific "
                    "concept — avoid vague or overly broad questions."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Create {count} flashcards from the following content.{topic_line} "
                    "Each flashcard should have a 'front' (a question or term) and a "
                    "'back' (the answer or definition). Focus on key concepts, "
                    "definitions, and important facts a student would need to remember.\n\n"
                    f"Content:\n{text}\n\n"
                    "Return ONLY a JSON array in this exact format, no markdown "
                    "formatting, no commentary:\n"
                    '[{"front": "...", "back": "..."}, ...]'
                ),
            },
        ],
        max_tokens=3000,
    )

    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    try:
        items: list = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON for flashcards: {exc}") from exc

    valid = [
        {"front": item["front"].strip(), "back": item["back"].strip()}
        for item in items
        if isinstance(item, dict)
        and isinstance(item.get("front"), str)
        and item["front"].strip()
        and isinstance(item.get("back"), str)
        and item["back"].strip()
    ]

    if not valid:
        raise ValueError("LLM returned no valid flashcard items.")

    return valid


def generate_quiz_questions(text: str, count: int, topic: str | None) -> list[dict]:
    """Generate quiz question dicts [{question, options, correct_index, explanation}, ...] from source text."""
    topic_line = f" Focus specifically on the topic: {topic}." if topic else ""
    raw = _chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an academic quiz generator. You create multiple choice questions "
                    "only from the content provided. Never introduce facts not present in the source "
                    "text. Each question must test one specific, unambiguous concept. Wrong answer "
                    "options (distractors) must be plausible but clearly incorrect to someone who "
                    "understands the material — avoid trick questions and obviously wrong distractors."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Create {count} multiple choice quiz questions from the following "
                    f"content.{topic_line}\n\n"
                    "For each question provide:\n"
                    "- A clear question\n"
                    "- Exactly 4 answer options (one correct, three plausible distractors)\n"
                    "- The index of the correct answer (0, 1, 2, or 3)\n"
                    "- A brief explanation of why the correct answer is right (1-2 sentences)\n\n"
                    f"Content:\n{text}\n\n"
                    "Return ONLY a JSON array in this exact format, no markdown formatting, no commentary:\n"
                    "[\n"
                    "  {\n"
                    '    "question": "...",\n'
                    '    "options": ["...", "...", "...", "..."],\n'
                    '    "correct_index": 0,\n'
                    '    "explanation": "..."\n'
                    "  }\n"
                    "]"
                ),
            },
        ],
        max_tokens=4000,
    )

    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    try:
        items: list = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON for quiz questions: {exc}") from exc

    valid: list[dict] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        q = item.get("question")
        opts = item.get("options")
        cidx = item.get("correct_index")
        exp = item.get("explanation")
        if (
            isinstance(q, str)
            and q.strip()
            and isinstance(opts, list)
            and len(opts) == 4
            and all(isinstance(o, str) and o.strip() for o in opts)
            and isinstance(cidx, int)
            and 0 <= cidx <= 3
        ):
            valid.append(
                {
                    "question": q.strip(),
                    "options": [o.strip() for o in opts],
                    "correct_index": cidx,
                    "explanation": exp.strip() if isinstance(exp, str) and exp.strip() else None,
                }
            )

    if not valid:
        raise ValueError("LLM returned no valid quiz question items.")

    return valid


def generate_mind_map(text: str, topic: str | None) -> dict:
    """Generate a mind map dict {nodes: [...], edges: [...]} from source text."""
    topic_line = f" Focus specifically on the topic: {topic}." if topic else ""
    raw = _chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an academic mind map generator. You extract key concepts and "
                    "their relationships only from the content provided. Never introduce concepts not "
                    "present in the source text. Structure your output as a clear hierarchy: one root "
                    "concept (the central topic), several branch concepts (major themes), and leaf "
                    "concepts (specific details or subtopics under each branch)."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Create a mind map from the following content.{topic_line}\n\n"
                    "Extract:\n"
                    "- 1 root node: the central topic of the content\n"
                    "- 4-8 branch nodes: major themes or categories\n"
                    "- 8-16 leaf nodes: specific concepts, definitions, or details that fall under a branch\n"
                    "- Edges connecting them with a short relationship label (e.g. 'includes', "
                    "'is defined as', 'leads to', 'is a type of', 'contrasts with', 'depends on')\n\n"
                    f"Content:\n{text}\n\n"
                    "Return ONLY a JSON object in this exact format, no markdown formatting, no commentary:\n"
                    "{\n"
                    '  "nodes": [\n'
                    '    {"id": "n1", "label": "...", "description": "...", "node_type": "root"},\n'
                    '    {"id": "n2", "label": "...", "description": "...", "node_type": "branch"},\n'
                    '    {"id": "n3", "label": "...", "description": "...", "node_type": "leaf"}\n'
                    "  ],\n"
                    '  "edges": [\n'
                    '    {"source": "n1", "target": "n2", "label": "includes"},\n'
                    '    {"source": "n2", "target": "n3", "label": "is defined as"}\n'
                    "  ]\n"
                    "}"
                ),
            },
        ],
        max_tokens=4000,
    )

    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
    try:
        data: dict = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned invalid JSON for mind map: {exc}") from exc

    raw_nodes = data.get("nodes", [])
    raw_edges = data.get("edges", [])

    if not isinstance(raw_nodes, list):
        raise ValueError("LLM mind map response missing 'nodes' list.")

    valid_node_ids: set[str] = set()
    valid_nodes: list[dict] = []
    _VALID_TYPES = {"root", "branch", "leaf"}

    for node in raw_nodes:
        if not isinstance(node, dict):
            continue
        nid = node.get("id")
        label = node.get("label")
        ntype = node.get("node_type")
        if (
            isinstance(nid, str) and nid.strip()
            and isinstance(label, str) and label.strip()
            and isinstance(ntype, str) and ntype in _VALID_TYPES
        ):
            desc = node.get("description")
            valid_nodes.append({
                "id": nid.strip(),
                "label": label.strip(),
                "description": desc.strip() if isinstance(desc, str) and desc.strip() else None,
                "node_type": ntype,
            })
            valid_node_ids.add(nid.strip())

    if not valid_nodes:
        raise ValueError("LLM returned no valid mind map nodes.")

    valid_edges: list[dict] = []
    if isinstance(raw_edges, list):
        for edge in raw_edges:
            if not isinstance(edge, dict):
                continue
            src = edge.get("source")
            tgt = edge.get("target")
            lbl = edge.get("label")
            if (
                isinstance(src, str) and src.strip() in valid_node_ids
                and isinstance(tgt, str) and tgt.strip() in valid_node_ids
                and isinstance(lbl, str) and lbl.strip()
                and src.strip() != tgt.strip()
            ):
                valid_edges.append({
                    "source": src.strip(),
                    "target": tgt.strip(),
                    "label": lbl.strip(),
                })

    return {"nodes": valid_nodes, "edges": valid_edges}


def combine_summaries(summaries: list[str], target_words: int) -> str:
    """Merge a list of chunk summaries into one cohesive final summary."""
    joined = "\n\n".join(summaries)
    return _chat(
        [
            {
                "role": "system",
                "content": (
                    "You are an academic summarization assistant. You write clear, "
                    "well-organized summaries for students reviewing study material. "
                    "You summarize only the content given to you and never introduce "
                    "outside information."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Below are summaries of consecutive sections from the same document, "
                    "in order. Combine them into a single cohesive summary of the whole "
                    "document.\n\n"
                    f"Section summaries:\n{joined}\n\n"
                    "Instructions:\n"
                    f"- Write approximately {target_words} words.\n"
                    "- Merge related points across sections rather than listing them section "
                    "by section.\n"
                    "- Use clear paragraphs, no headers or bullet points.\n"
                    "- Do not mention 'sections,' 'chunks,' or that this was built from "
                    "parts — write as if summarizing the original document directly.\n\n"
                    "Return only the summary text."
                ),
            },
        ],
        max_tokens=1024,
    )
