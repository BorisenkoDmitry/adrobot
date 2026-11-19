from urllib.parse import urlsplit

from pydantic import SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", env_ignore_empty=True)

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "adrobot"
    postgres_user: str = "adrobot"
    postgres_password: SecretStr = SecretStr("adrobot-local")

    keitaro_base_url: str = ""
    keitaro_api_key: SecretStr = SecretStr("")
    keitaro_key_encryption_key: SecretStr = SecretStr("")

    @field_validator("keitaro_base_url")
    @classmethod
    def validate_tracker_origin(cls, value: str) -> str:
        value = value.strip().rstrip("/")
        if value:
            parts = urlsplit(value)
            if (
                parts.scheme != "https"
                or not parts.hostname
                or parts.path
                or parts.query
                or parts.fragment
                or parts.username is not None
            ):
                raise ValueError("Используйте HTTPS-адрес Keitaro без /admin и пути API.")
        return value

    @property
    def database_url(self) -> URL:
        return URL.create(
            "postgresql+asyncpg",
            username=self.postgres_user,
            password=self.postgres_password.get_secret_value(),
            host=self.postgres_host,
            port=self.postgres_port,
            database=self.postgres_db,
        )
