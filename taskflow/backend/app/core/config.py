from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Taskflow API"
    API_V1_STR: str = "/api"

    # Database (defaults to local SQLite for zero-configuration startup; override in .env for PostgreSQL)
    DATABASE_URL: str = "sqlite:///./taskflow.db"
    TEST_DATABASE_URL: str = "sqlite:///./test.db"

    # JWT Authentication
    SECRET_KEY: str = "taskflow-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS & Frontend
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def cors_origins(self) -> List[str]:
        origins = {
            self.FRONTEND_URL.rstrip("/"),
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        }
        return list(origins)

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
