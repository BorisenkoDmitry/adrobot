from typing import Literal

from pydantic import BaseModel, Field


class CatalogItem(BaseModel):
    id: int
    name: str


class Offer(CatalogItem):
    state: str = "active"


class Campaign(CatalogItem):
    alias: str
    state: str
    domain_id: int | None = None
    group_id: int | None = None
    traffic_source_id: int | None = None
    url: str | None = None
    admin_url: str | None = None


class RemoteOffer(BaseModel):
    offer_id: int
    share: int = Field(ge=0, le=100)
    state: Literal["active", "disabled"] = "active"


class RemoteFilter(BaseModel):
    name: str
    mode: str
    payload: object | None = None


class RemoteStream(CatalogItem):
    campaign_id: int
    type: str
    schema_: str = Field(alias="schema")
    position: int = 0
    state: str = "active"
    action_type: str | None = None
    action_payload: str | dict | None = None
    filters: list[RemoteFilter] = Field(default_factory=list)
    offers: list[RemoteOffer] = Field(default_factory=list)

    @property
    def editable(self) -> bool:
        return self.schema_ == "landings"
