import asyncio
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session

router = APIRouter(prefix="/health", tags=["health"])


class Readiness(BaseModel):
    status: Literal["ready", "unavailable"]
    database: Literal["up", "down"]


@router.get("/live")
async def live() -> dict[str, str]:
    return {"status": "alive"}


@router.get("/ready", responses={503: {"model": Readiness}})
async def ready(
    response: Response, session: Annotated[AsyncSession, Depends(get_session)]
) -> Readiness:
    try:
        async with asyncio.timeout(2):
            await session.execute(text("SELECT 1"))
    except (SQLAlchemyError, OSError):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return Readiness(status="unavailable", database="down")
    return Readiness(status="ready", database="up")
