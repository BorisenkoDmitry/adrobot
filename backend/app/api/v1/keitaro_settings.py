from typing import Literal

from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, ConfigDict, SecretStr

from app.api.dependencies import (
    AppSettings,
    Database,
    KeyCipher,
    get_keitaro,
    tracker_with_key,
)
from app.keitaro.client import KeitaroError
from app.keitaro.credentials import (
    KeitaroCredential,
    decrypt_key,
    save_key,
    validate_api_key,
)

router = APIRouter(prefix="/settings/keitaro", tags=["Keitaro settings"])


class KeyStatus(BaseModel):
    source: Literal["saved", "environment", "none"]
    storage_available: bool


class SaveKey(BaseModel):
    model_config = ConfigDict(extra="forbid")
    api_key: SecretStr


class TestKey(BaseModel):
    model_config = ConfigDict(extra="forbid")
    api_key: SecretStr | None = None


@router.get("")
async def key_status(settings: AppSettings, db: Database, cipher: KeyCipher) -> KeyStatus:
    stored = await db.get(KeitaroCredential, 1)
    source: Literal["saved", "environment", "none"] = "none"
    if stored is not None:
        source = "saved"
    elif settings.keitaro_api_key.get_secret_value():
        source = "environment"
    return KeyStatus(source=source, storage_available=cipher is not None)


@router.put("")
async def configure_key(body: SaveKey, db: Database, cipher: KeyCipher) -> KeyStatus:
    await save_key(db, body.api_key.get_secret_value(), cipher)
    return KeyStatus(source="saved", storage_available=True)


@router.post("/test")
async def test_key(body: TestKey, request: Request) -> dict[str, bool]:
    if body.api_key is None:
        tracker = await get_keitaro(request)
    else:
        tracker = tracker_with_key(request, validate_api_key(body.api_key.get_secret_value()))
    await tracker.campaigns(limit=1, offset=0)
    return {"ok": True}


@router.post("/reveal")
async def reveal_key(db: Database, cipher: KeyCipher, response: Response) -> dict[str, str]:
    response.headers["Cache-Control"] = "no-store"
    stored = await db.get(KeitaroCredential, 1)
    if stored is None:
        raise KeitaroError(404, "Сохранённого ключа Keitaro нет.")
    return {"api_key": decrypt_key(stored, cipher)}
