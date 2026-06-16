from groq import Groq

from app.core.config import settings


def generate(prompt: str) -> str:
    """Send prompt to Groq (free tier) and return the text response."""
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    return response.choices[0].message.content
