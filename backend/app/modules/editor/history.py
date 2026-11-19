from sqlalchemy import Text, cast, column, func, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.keitaro.schemas import Campaign, RemoteStream
from app.modules.editor.domain import TrackedOffer
from app.modules.editor.model import StreamPublication
from app.modules.editor.schemas import (
    CampaignHistoryFilters,
    CampaignHistoryView,
    HistoryAction,
    OfferHistoryChange,
    OfferHistoryState,
    StreamPublicationView,
)


def _history_state(offer: TrackedOffer | None) -> OfferHistoryState | None:
    if offer is None or offer.state == "removed":
        return None
    return OfferHistoryState(share=offer.share, pinned=offer.pinned, state=offer.state)


def _actions(
    before: OfferHistoryState | None, after: OfferHistoryState | None, *, restored: bool
) -> list[HistoryAction]:
    if before is None:
        return ["restored" if restored else "added"]
    if after is None:
        return ["removed"]
    actions: list[HistoryAction] = []
    if before.share != after.share:
        actions.append("share")
    if before.pinned != after.pinned:
        actions.append("pinned" if after.pinned else "unpinned")
    if before.state != after.state:
        actions.append("state")
    return actions


def _changes(before: list[TrackedOffer], after: list[TrackedOffer]) -> list[OfferHistoryChange]:
    previous = {offer.offer_id: offer for offer in before}
    current = {offer.offer_id: offer for offer in after}
    changes = []
    for offer_id in sorted(previous.keys() | current.keys()):
        old_offer = previous.get(offer_id)
        old_state = _history_state(old_offer)
        new_state = _history_state(current.get(offer_id))
        if old_state != new_state:
            offer = current.get(offer_id) or previous[offer_id]
            changes.append(
                OfferHistoryChange(
                    offer_id=offer_id,
                    name=offer.name,
                    actions=_actions(
                        old_state,
                        new_state,
                        restored=old_offer is not None and old_offer.state == "removed",
                    ),
                    before=old_state,
                    after=new_state,
                )
            )
    return changes


def record_publication(
    session: AsyncSession,
    stream: RemoteStream,
    before: list[TrackedOffer],
    after: list[TrackedOffer],
) -> None:
    changes = _changes(before, after)
    if changes:
        session.add(
            StreamPublication(
                campaign_id=stream.campaign_id,
                stream_id=stream.id,
                stream_name=stream.name,
                changes=[change.model_dump() for change in changes],
            )
        )


async def list_publications(
    session: AsyncSession, campaign: Campaign, filters: CampaignHistoryFilters
) -> CampaignHistoryView:
    publication_id = StreamPublication.id
    statement = select(StreamPublication).where(StreamPublication.campaign_id == campaign.id)
    if filters.cursor is not None:
        if filters.descending:
            statement = statement.where(publication_id < filters.cursor)
        else:
            statement = statement.where(publication_id > filters.cursor)
    if filters.from_date is not None:
        statement = statement.where(StreamPublication.published_at >= filters.from_date)
    if filters.until_date is not None:
        statement = statement.where(StreamPublication.published_at < filters.until_date)
    if filters.stream:
        needle = filters.stream.removeprefix("#") or "#"
        statement = statement.where(
            or_(
                StreamPublication.stream_name.icontains(filters.stream, autoescape=True),
                cast(StreamPublication.stream_id, Text).contains(needle, autoescape=True),
            )
        )
    if filters.offer or filters.action:
        statement = statement.where(_offer_matches(filters))

    order = publication_id.desc() if filters.descending else publication_id.asc()
    limit = filters.limit
    rows = (await session.scalars(statement.order_by(order).limit(limit + 1))).all()
    return CampaignHistoryView(
        campaign_name=campaign.name,
        entries=[
            StreamPublicationView(
                id=row.id,
                stream_id=row.stream_id,
                stream_name=row.stream_name,
                published_at=row.published_at,
                changes=row.changes,
            )
            for row in rows[:limit]
        ],
        next_cursor=rows[limit - 1].id if len(rows) > limit else None,
    )


def _offer_matches(filters: CampaignHistoryFilters):
    elements = func.jsonb_array_elements(StreamPublication.changes).table_valued(
        column("value", JSONB)
    )
    match = select(1).select_from(elements)
    value = elements.c.value
    if filters.offer:
        needle = filters.offer.removeprefix("#") or "#"
        match = match.where(
            or_(
                value["name"].astext.icontains(filters.offer, autoescape=True),
                value["offer_id"].astext.contains(needle, autoescape=True),
            )
        )
    if filters.action:
        match = match.where(value["actions"].contains([filters.action]))
    return match.exists()
