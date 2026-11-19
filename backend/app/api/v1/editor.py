from fastapi import APIRouter

from app.api.dependencies import Database, Tracker
from app.api.v1.campaigns import ResourceID
from app.modules.editor.schemas import ChangeRevision, DraftChange, StreamView
from app.modules.editor.service import cancel_draft, change_draft, fetch_streams, publish_draft

router = APIRouter(prefix="/campaigns/{campaign_id}/streams", tags=["stream editor"])


@router.get("")
async def list_streams(campaign_id: ResourceID, tracker: Tracker, db: Database) -> list[StreamView]:
    return await fetch_streams(db, tracker, campaign_id)


@router.post("/{stream_id}/draft")
async def edit_stream(
    campaign_id: ResourceID,
    stream_id: ResourceID,
    data: DraftChange,
    tracker: Tracker,
    db: Database,
) -> StreamView:
    return await change_draft(db, tracker, campaign_id, stream_id, data)


@router.post("/{stream_id}/cancel")
async def cancel_stream_draft(
    campaign_id: ResourceID,
    stream_id: ResourceID,
    data: ChangeRevision,
    tracker: Tracker,
    db: Database,
) -> StreamView:
    return await cancel_draft(db, tracker, campaign_id, stream_id, data.revision)


@router.post("/{stream_id}/publish")
async def publish_stream_draft(
    campaign_id: ResourceID,
    stream_id: ResourceID,
    data: ChangeRevision,
    tracker: Tracker,
    db: Database,
) -> StreamView:
    return await publish_draft(db, tracker, campaign_id, stream_id, data.revision)
