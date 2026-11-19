from fastapi import APIRouter

from app.api.v1 import campaigns, editor, health

router = APIRouter(prefix="/api/v1")
router.include_router(health.router)
router.include_router(campaigns.router)
router.include_router(editor.router)
