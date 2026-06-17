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
