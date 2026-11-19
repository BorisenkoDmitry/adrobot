from datetime import datetime
from typing import Annotated, Literal, Self

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

DraftAction = Literal["add", "remove", "restore", "toggle_pin"]


class ChangeRevision(BaseModel):
    model_config = ConfigDict(extra="forbid")

    revision: Annotated[int, Field(gt=0)]


class DraftChange(ChangeRevision):
    action: DraftAction
    offer_id: Annotated[int, Field(gt=0)]


class OfferView(BaseModel):
    offer_id: int
    name: str
    share: int
    pinned: bool
    removed: bool


class StreamView(BaseModel):
    id: int
    campaign_id: int
    name: str
    type: str
    schema_: str = Field(serialization_alias="schema")
    editable: bool
    dirty: bool = False
    conflicted: bool = False
    revision: int = 0
    offers: list[OfferView] = Field(default_factory=list)


class OfferHistoryState(BaseModel):
    share: int
    pinned: bool
    state: Literal["active", "disabled"]


HistoryAction = Literal["added", "removed", "restored", "share", "pinned", "unpinned", "state"]


class OfferHistoryChange(BaseModel):
    offer_id: int
    name: str
    actions: list[HistoryAction]
    before: OfferHistoryState | None
    after: OfferHistoryState | None


class StreamPublicationView(BaseModel):
    id: int
    stream_id: int
    stream_name: str
    published_at: datetime
    changes: list[OfferHistoryChange]


class CampaignHistoryView(BaseModel):
    campaign_name: str
    entries: list[StreamPublicationView]
    next_cursor: int | None


class CampaignHistoryFilters(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    limit: int = Field(default=20, ge=1, le=100)
    cursor: int | None = Field(default=None, gt=0, le=9_223_372_036_854_775_807)
    descending: bool = True
    stream: str = Field(default="", max_length=160)
    offer: str = Field(default="", max_length=160)
    action: HistoryAction | None = None
    from_date: AwareDatetime | None = None
    until_date: AwareDatetime | None = None

    @model_validator(mode="after")
    def check_period(self) -> Self:
        if self.from_date and self.until_date and self.from_date >= self.until_date:
            raise ValueError("Дата окончания должна быть позже начала периода.")
        return self
