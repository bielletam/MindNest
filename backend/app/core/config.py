from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./mindnest.db"
    UPLOAD_DIR: str = "storage/uploads"
    CHROMA_DIR: str = "storage/chroma"
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    SECRET_KEY: str = "change-this-in-production"


settings = Settings()
