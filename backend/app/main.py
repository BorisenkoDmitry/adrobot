from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.api.v1.router import router
from app.core.config import Settings
from app.keitaro.client import KeitaroClient, KeitaroError
from app.modules.editor.domain import EditorError


def create_app(
    settings: Settings | None = None, *, keitaro_transport: httpx.AsyncBaseTransport | None = None
) -> FastAPI:
    config = settings or Settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        engine = create_async_engine(config.database_url, pool_pre_ping=True)
        application.state.session_factory = async_sessionmaker(engine, expire_on_commit=False)
        application.state.settings = config
        key = config.keitaro_api_key.get_secret_value()
        try:
            async with httpx.AsyncClient(
                base_url=f"{config.keitaro_base_url}/admin_api/v1/",
                headers={"Api-Key": key, "Accept": "application/json"},
                timeout=httpx.Timeout(12, connect=4),
                follow_redirects=False,
                trust_env=False,
                transport=keitaro_transport,
            ) as http:
                application.state.keitaro = KeitaroClient(
                    http, configured=bool(key and config.keitaro_base_url)
                )
                yield
        finally:
            await engine.dispose()

    application = FastAPI(title="Adrobot API", version="0.1.0", lifespan=lifespan)

    @application.exception_handler(KeitaroError)
    @application.exception_handler(EditorError)
    async def handle_service_error(
        request: Request, error: KeitaroError | EditorError
    ) -> JSONResponse:
        return JSONResponse({"detail": error.public_message}, status_code=error.status_code)

    application.include_router(router)
    return application


app = create_app()
