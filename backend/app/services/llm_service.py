import json
import re

from groq import Groq

from app.core.config import settings

_MODEL = "llama-3.1-8b-instant"


def _chat(messages: list[dict], max_tokens: int = 1024) -> str:
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model=_MODEL,
        messages=messages,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content or ""


def generate(prompt: str) -> str:
    """Send a single user-turn prompt to Groq and return the text response."""
    return _chat([{"role": "user", "content": prompt}])


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
