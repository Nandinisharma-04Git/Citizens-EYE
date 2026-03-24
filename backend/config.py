import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR / "env.sample")


@dataclass
class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "").strip()
    mongodb_db: str = os.getenv("MONGODB_DB", "citizens_eye")
    allow_mock_storage: bool = os.getenv("ALLOW_MOCK_STORAGE", "true").lower() == "true"
    seed_data: bool = os.getenv("SEED_DATA", "true").lower() == "true"


@lru_cache
def get_settings() -> Settings:
    return Settings()


