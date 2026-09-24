import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "CapTrack IPO Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = ""
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./captrack.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    REFRESH_CRON_INTERVAL_HOURS: int = 24
    CORS_ORIGINS: List[str] = ["*"]
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
