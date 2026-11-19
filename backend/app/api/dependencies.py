from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.db.session import get_session
from app.keitaro.client import KeitaroClient


def get_keitaro(request: Request) -> KeitaroClient:
    return request.app.state.keitaro


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


Tracker = Annotated[KeitaroClient, Depends(get_keitaro)]
AppSettings = Annotated[Settings, Depends(get_settings)]
Database = Annotated[AsyncSession, Depends(get_session)]
