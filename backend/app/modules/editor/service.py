import asyncio

from sqlalchemy import BigInteger, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.keitaro.client import KeitaroClient, KeitaroError
from app.keitaro.schemas import RemoteStream
from app.modules.editor.domain import (
    EditorError,
    TrackedOffer,
    apply_action,
    merge_published,
    prepare_publish,
    remote_signature,
    tracked_list,
)
from app.modules.editor.history import record_publication
from app.modules.editor.model import StreamEdit
from app.modules.editor.schemas import DraftChange, StreamView


async def _lock_campaign(session: AsyncSession, campaign_id: int) -> None:
    # Every request that reconciles or mutates this campaign takes the same transaction lock.
    await session.execute(select(func.pg_advisory_xact_lock(cast(campaign_id, BigInteger))))


def _make_view(stream: RemoteStream, edit: StreamEdit | None = None) -> StreamView:
    view = StreamView(
        id=stream.id,
        campaign_id=stream.campaign_id,
        name=stream.name,
        type=stream.type,
        schema_=stream.schema_,
        editable=stream.editable,
    )
    if edit is not None:
        dirty = edit.draft is not None
        visible = tracked_list.validate_python(edit.draft if dirty else edit.published)
        view.dirty = dirty
        view.conflicted = edit.conflicted
        view.revision = edit.revision
        view.offers = [offer.show() for offer in visible]
    return view


async def _names(
    keitaro: KeitaroClient, stream: RemoteStream, current: list[TrackedOffer]
) -> dict[int, str]:
    known = {offer.offer_id for offer in current}
    missing = {offer.offer_id for offer in stream.offers if offer.offer_id not in known}
    limiter = asyncio.Semaphore(6)

    async def lookup(offer_id: int) -> tuple[int, str]:
        async with limiter:
            try:
                offer = await keitaro.offer(offer_id)
                return offer_id, offer.name
            except KeitaroError:
                # Keitaro can allow a stream to be read without access to all of its offers.
                return offer_id, f"Оффер #{offer_id}"

    return dict(await asyncio.gather(*(lookup(offer_id) for offer_id in missing)))


async def _sync(
    session: AsyncSession,
    keitaro: KeitaroClient,
    stream: RemoteStream,
    edit: StreamEdit | None,
    *,
    discard_draft: bool = False,
) -> StreamEdit:
    signature = remote_signature(stream.offers)
    if edit is not None and edit.draft is not None and not discard_draft:
        conflict = edit.remote_offers != signature
        if conflict:
            draft = tracked_list.validate_python(edit.draft)
            try:
                conflict = remote_signature(prepare_publish(draft)) != signature
            except EditorError:
                pass
        if conflict != edit.conflicted:
            edit.conflicted = conflict
            edit.revision += 1
        return edit

    previous = tracked_list.validate_python(edit.published) if edit else []
    names = await _names(keitaro, stream, previous)
    current = merge_published(previous, stream.offers, names)
    published = [offer.model_dump() for offer in current]
    if edit is None:
        edit = StreamEdit(
            campaign_id=stream.campaign_id,
            stream_id=stream.id,
            published=published,
            remote_offers=signature,
            revision=1,
            conflicted=False,
        )
        session.add(edit)
    elif edit.published != published or edit.remote_offers != signature or edit.draft is not None:
        edit.published = published
        edit.remote_offers = signature
        edit.draft = None
        edit.conflicted = False
        edit.revision += 1
    return edit


async def fetch_streams(
    session: AsyncSession, keitaro: KeitaroClient, campaign_id: int
) -> list[StreamView]:
    async with session.begin():
        await _lock_campaign(session, campaign_id)
        streams = await keitaro.streams(campaign_id)
        local = await session.scalars(
            select(StreamEdit).where(StreamEdit.campaign_id == campaign_id)
        )
        edits = {edit.stream_id: edit for edit in local}
        views = []
        for stream in sorted(
            streams, key=lambda stream: (stream.type == "default", stream.position)
        ):
            if stream.campaign_id != campaign_id:
                raise EditorError("Keitaro вернул поток другой кампании.", 502)
            edit = (
                await _sync(session, keitaro, stream, edits.get(stream.id))
                if stream.editable
                else None
            )
            views.append(_make_view(stream, edit))
    return views


async def _get_edit(
    session: AsyncSession,
    keitaro: KeitaroClient,
    campaign_id: int,
    stream_id: int,
    revision: int,
) -> tuple[RemoteStream, StreamEdit]:
    await _lock_campaign(session, campaign_id)
    stream = await keitaro.stream(stream_id)
    if stream.campaign_id != campaign_id:
        raise EditorError("Поток не принадлежит этой кампании.", 404)
    if not stream.editable:
        raise EditorError("Этот поток не использует офферы.", 409)
    edit = await session.get(StreamEdit, (campaign_id, stream_id))
    if edit is None or edit.revision != revision:
        raise EditorError("Поток изменился. Обновите список потоков и повторите действие.", 409)
    return stream, edit


async def change_draft(
    session: AsyncSession,
    keitaro: KeitaroClient,
    campaign_id: int,
    stream_id: int,
    data: DraftChange,
) -> StreamView:
    async with session.begin():
        stream, edit = await _get_edit(session, keitaro, campaign_id, stream_id, data.revision)
        if edit.remote_offers != remote_signature(stream.offers):
            raise EditorError(
                "Поток изменился в Keitaro. Обновите потоки перед редактированием.", 409
            )
        visible = tracked_list.validate_python(
            edit.draft if edit.draft is not None else edit.published
        )
        name = None
        if data.action in {"add", "restore"}:
            offer = await keitaro.offer(data.offer_id)
            if offer.state != "active":
                raise EditorError("Этот оффер отключён или находится в архиве Keitaro.")
            name = offer.name
        changed = apply_action(visible, data.action, data.offer_id, name=name)
        data_to_save = [offer.model_dump() for offer in changed]
        edit.draft = data_to_save if data_to_save != edit.published else None
        edit.conflicted = False
        edit.revision += 1
        return _make_view(stream, edit)


async def cancel_draft(
    session: AsyncSession, keitaro: KeitaroClient, campaign_id: int, stream_id: int, revision: int
) -> StreamView:
    async with session.begin():
        stream, edit = await _get_edit(session, keitaro, campaign_id, stream_id, revision)
        await _sync(session, keitaro, stream, edit, discard_draft=True)
        return _make_view(stream, edit)


async def publish_draft(
    session: AsyncSession, keitaro: KeitaroClient, campaign_id: int, stream_id: int, revision: int
) -> StreamView:
    async with session.begin():
        stream, edit = await _get_edit(session, keitaro, campaign_id, stream_id, revision)
        if edit.draft is None:
            await _sync(session, keitaro, stream, edit)
            return _make_view(stream, edit)

        draft = tracked_list.validate_python(edit.draft)
        target = prepare_publish(draft)
        desired = remote_signature(target)
        current = remote_signature(stream.offers)
        if current != desired:
            if current != edit.remote_offers:
                raise EditorError(
                    "Поток изменился в Keitaro. Обновите список и отмените черновик.",
                    409,
                )
            try:
                await keitaro.set_stream_offers(stream.id, target)
            except KeitaroError as error:
                if error.status_code not in (502, 504):
                    raise
                stream = await keitaro.stream(stream.id)
                if remote_signature(stream.offers) != desired:
                    raise error
            else:
                stream = await keitaro.stream(stream.id)
            if remote_signature(stream.offers) != desired:
                raise EditorError("Keitaro не подтвердил новые доли. Черновик сохранён.", 502)

        published = merge_published(draft, stream.offers, {})
        record_publication(session, stream, tracked_list.validate_python(edit.published), published)
        edit.published = [offer.model_dump() for offer in published]
        edit.remote_offers = desired
        edit.draft = None
        edit.conflicted = False
        edit.revision += 1
        return _make_view(stream, edit)
