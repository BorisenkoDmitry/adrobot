from typing import Annotated

from fastapi import APIRouter, Path, Query

from app.api.dependencies import AppSettings, Database, Tracker
from app.core.config import Settings
from app.keitaro.schemas import Campaign, Offer
from app.modules.editor.history import list_publications
from app.modules.editor.schemas import CampaignHistoryFilters, CampaignHistoryView

router = APIRouter(tags=["campaigns"])
ResourceID = Annotated[int, Path(gt=0, le=2_147_483_647)]


def _with_admin_link(campaign: Campaign, settings: Settings) -> Campaign:
    return campaign.model_copy(
        update={"admin_url": f"{settings.keitaro_base_url}/admin/#!/campaign/{campaign.id}/notes"}
    )


@router.get("/offers")
async def list_offers(tracker: Tracker) -> list[Offer]:
    return await tracker.offers()


@router.get("/offers/{offer_id}")
async def get_offer(offer_id: ResourceID, tracker: Tracker) -> Offer:
    return await tracker.offer(offer_id)


@router.get("/campaigns")
async def list_campaigns(
    tracker: Tracker,
    settings: AppSettings,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[Campaign]:
    campaigns = await tracker.campaigns(limit, offset)
    return [_with_admin_link(campaign, settings) for campaign in campaigns]


@router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: ResourceID, tracker: Tracker, settings: AppSettings
) -> Campaign:
    return _with_admin_link(await tracker.campaign(campaign_id), settings)


@router.get("/campaigns/{campaign_id}/history")
async def get_campaign_history(
    campaign_id: ResourceID,
    tracker: Tracker,
    db: Database,
    filters: Annotated[CampaignHistoryFilters, Query()],
) -> CampaignHistoryView:
    campaign = await tracker.campaign(campaign_id)
    return await list_publications(db, campaign, filters)
