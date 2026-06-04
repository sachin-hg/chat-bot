from functools import lru_cache
from typing import Literal, Optional

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # PostgreSQL (via PgBouncer)
    postgres_host:     str              = "localhost"
    postgres_port:     int              = 5433
    postgres_db:       str              = "chatbot"
    postgres_user:     str              = "chatbot"
    postgres_password: Optional[SecretStr] = None   # required in local/staging/prod

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_consumer_group:    str = "chat-db-writer"

    # Anthropic
    anthropic_api_key: Optional[SecretStr] = None   # required when using real SLM/LLM

    # External APIs
    khoj_base_url:          str = ""
    odin_base_url:          str = ""
    casa_base_url:          str = ""
    venus_base_url:         str = ""
    autosuggest_base_url:   str = ""
    gandalf_base_url:       str = ""
    regions_base_url:       str = ""
    data_base_url:          str = ""
    seo_base_url:           str = ""
    user_activity_base_url: str = ""

    # Application
    bot_env:    Literal["mock", "dev", "local", "staging", "production"] = "dev"
    log_level:  str              = "INFO"
    # Reserved for session token HMAC signing (Sprint 3 auth hardening).
    # Currently unused — X-Session-Token is checked for presence only.
    secret_key: Optional[SecretStr] = None

    # Housing login service
    login_service_url: str = ""

    # LangSmith
    langchain_tracing_v2: bool            = False
    langchain_api_key:    Optional[SecretStr] = None
    langchain_project:    str             = "housing-bot-local"

    # LLM concurrency
    llm_max_concurrent:     int = 20
    llm_queue_max:          int = 50
    llm_queue_max_wait_ms:  int = 8000

    @property
    def database_url(self) -> str:
        pwd = self.postgres_password.get_secret_value() if self.postgres_password else ""
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{pwd}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
