from typing import Annotated

from cryptography.fernet import Fernet
from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.db.session import get_session
from app.keitaro.client import KeitaroClient
from app.keitaro.credentials import KeitaroCredential, decrypt_key


def get_base_tracker(request: Request) -> KeitaroClient:
    return request.app.state.keitaro


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_key_cipher(request: Request) -> Fernet | None:
    return request.app.state.keitaro_cipher


def tracker_with_key(request: Request, key: str) -> KeitaroClient:
    return KeitaroClient(
        get_base_tracker(request).http,
        configured=bool(get_settings(request).keitaro_base_url),
        api_key=key,
    )


async def get_keitaro(request: Request) -> KeitaroClient:
    async with request.app.state.session_factory() as session:
        stored = await session.get(KeitaroCredential, 1)
    if stored is None:
        return get_base_tracker(request)
    return tracker_with_key(request, decrypt_key(stored, get_key_cipher(request)))


Tracker = Annotated[KeitaroClient, Depends(get_keitaro)]
AppSettings = Annotated[Settings, Depends(get_settings)]
Database = Annotated[AsyncSession, Depends(get_session)]
KeyCipher = Annotated[Fernet | None, Depends(get_key_cipher)]
