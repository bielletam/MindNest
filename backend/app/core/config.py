from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./mindnest.db"
    UPLOAD_DIR: str = "storage/uploads"
    CHROMA_DIR: str = "storage/chroma"
    ANTHROPIC_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    SECRET_KEY: str = "change-this-in-production"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()
