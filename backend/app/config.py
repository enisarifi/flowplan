from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "llama-3.3-70b-versatile"

    class Config:
        env_file = ".env"


settings = Settings()
