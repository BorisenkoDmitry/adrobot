from collections.abc import Mapping
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

from app.keitaro.schemas import RemoteOffer
from app.modules.editor.schemas import DraftAction, OfferView


class EditorError(Exception):
    def __init__(self, message: str, status_code: int = 422) -> None:
        super().__init__(message)
        self.public_message = message
        self.status_code = status_code


class TrackedOffer(BaseModel):
    model_config = ConfigDict(frozen=True)

    offer_id: int
    name: str
    share: int = Field(ge=0, le=100)
    state: Literal["active", "disabled", "removed"] = "active"
    pinned: bool = False

    @property
    def active(self) -> bool:
        return self.state == "active"

    def show(self) -> OfferView:
        return OfferView(
            offer_id=self.offer_id,
            name=self.name,
            share=self.share if self.active else 0,
            pinned=self.pinned if self.active else False,
            removed=not self.active,
        )


tracked_list = TypeAdapter(list[TrackedOffer])


def remote_signature(offers: list[RemoteOffer]) -> list[dict]:
    return [offer.model_dump() for offer in sorted(offers, key=lambda offer: offer.offer_id)]


def merge_published(
    previous: list[TrackedOffer], remote: list[RemoteOffer], names: Mapping[int, str]
) -> list[TrackedOffer]:
    # Removed rows remain in the editor even after the association disappears in Keitaro.
    previous_by_id = {offer.offer_id: offer for offer in previous}
    remote_ids = {offer.offer_id for offer in remote}
    current = []
    for binding in remote:
        old = previous_by_id.get(binding.offer_id)
        name = names.get(binding.offer_id) or (old.name if old else f"Оффер #{binding.offer_id}")
        current.append(
            TrackedOffer(
                offer_id=binding.offer_id,
                name=name,
                share=binding.share,
                state=binding.state,
                pinned=bool(old and old.pinned and binding.state == "active"),
            )
        )
    current.extend(
        offer.model_copy(update={"state": "removed", "share": 0, "pinned": False})
        for offer in previous
        if offer.offer_id not in remote_ids
    )
    return current


def rebalance(offers: list[TrackedOffer]) -> list[TrackedOffer]:
    active = [offer for offer in offers if offer.active]
    if not active:
        return offers
    remaining = 100 - sum(offer.share for offer in active if offer.pinned)
    unlocked = [offer.offer_id for offer in active if not offer.pinned]
    if not unlocked:
        if remaining:
            raise EditorError("Снимите закрепление хотя бы с одного оффера для перерасчёта долей.")
        return offers
    if remaining < len(unlocked):
        raise EditorError("Снимите закрепление с оффера, чтобы освободить долю для перерасчёта.")

    share, remainder = divmod(remaining, len(unlocked))
    weights = {offer_id: share + (index < remainder) for index, offer_id in enumerate(unlocked)}
    return [
        offer.model_copy(update={"share": weights[offer.offer_id]})
        if offer.offer_id in weights
        else offer
        for offer in offers
    ]


def apply_action(
    offers: list[TrackedOffer], action: DraftAction, offer_id: int, *, name: str | None = None
) -> list[TrackedOffer]:
    index = next((i for i, item in enumerate(offers) if item.offer_id == offer_id), None)
    if action == "add":
        if index is not None:
            raise EditorError("Оффер уже есть в потоке или архиве.", 409)
        assert name is not None
        return rebalance([*offers, TrackedOffer(offer_id=offer_id, name=name, share=0)])

    if index is None:
        raise EditorError("Оффер не найден в потоке.", 404)
    offer = offers[index]
    changed = offers.copy()
    if action == "restore":
        if offer.active:
            raise EditorError("Оффер уже активен.", 409)
        changed[index] = offer.model_copy(update={"state": "active", "share": 0, "pinned": False})
        return rebalance(changed)

    if not offer.active:
        raise EditorError("Сначала верните оффер из архива.", 409)
    if action == "toggle_pin":
        changed[index] = offer.model_copy(update={"pinned": not offer.pinned})
        return rebalance(changed) if offer.pinned else changed
    changed.pop(index)
    changed.append(offer.model_copy(update={"state": "removed", "share": 0, "pinned": False}))
    return rebalance(changed)


def prepare_publish(offers: list[TrackedOffer]) -> list[RemoteOffer]:
    active = [offer for offer in offers if offer.active]
    if active and sum(offer.share for offer in active) != 100:
        raise EditorError("Сумма долей активных офферов должна быть равна 100%.")
    # Keep existing disabled bindings on Keitaro. Archived rows never go to the tracker.
    return [
        RemoteOffer(offer_id=offer.offer_id, share=offer.share, state=offer.state)
        for offer in offers
        if offer.state != "removed"
    ]
