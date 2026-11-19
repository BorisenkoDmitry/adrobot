from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import CheckConstraint, SmallInteger, Text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.keitaro.client import KeitaroError


class KeitaroCredential(Base):
    __tablename__ = "keitaro_credentials"
    __table_args__ = (CheckConstraint("id = 1", name="singleton"),)

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    encrypted_api_key: Mapped[str] = mapped_column(Text, nullable=False)


def validate_api_key(raw: str) -> str:
    key = raw.strip()
    if not key or len(key) > 4096 or not key.isascii() or not key.isprintable() or " " in key:
        raise KeitaroError(422, "Введите корректный ключ API Keitaro.")
    return key


def require_cipher(cipher: Fernet | None) -> Fernet:
    if cipher is None:
        raise KeitaroError(503, "Шифрование ключей не настроено на сервере.")
    return cipher


def decrypt_key(credential: KeitaroCredential, cipher: Fernet | None) -> str:
    try:
        return require_cipher(cipher).decrypt(credential.encrypted_api_key.encode("ascii")).decode()
    except (InvalidToken, UnicodeError) as exc:
        raise KeitaroError(503, "Сохранённый ключ не удалось расшифровать.") from exc


async def save_key(session: AsyncSession, raw: str, cipher: Fernet | None) -> None:
    key = validate_api_key(raw)
    encrypted = require_cipher(cipher).encrypt(key.encode("ascii")).decode("ascii")
    statement = insert(KeitaroCredential).values(id=1, encrypted_api_key=encrypted)
    await session.execute(statement.on_conflict_do_update(
        index_elements=[KeitaroCredential.id],
        set_={"encrypted_api_key": statement.excluded.encrypted_api_key},
    ))
    await session.commit()
