import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Relationship Intelligence AI"
    ENVIRONMENT: str = "development"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://keeva-frontend.vercel.app"
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]
    
    # Firebase
    FIREBASE_PROJECT_ID: str = "keeva-relationship-ai"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ""
    USE_MOCK_AUTH_IN_DEV: bool = False  # Strict JWT verification enforced
    
    # AI & Memory
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MEM0_API_KEY: str = os.getenv("MEM0_API_KEY", "")
    
    # Consequence Thresholds
    CONSEQUENCE_THRESHOLD: float = 0.65
    EMOTIONAL_INTENSITY_THRESHOLD: float = 0.60
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
