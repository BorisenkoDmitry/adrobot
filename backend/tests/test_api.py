import json
import os
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.core.config import Settings
from app.main import create_app

BASE = "/api/v1"
REGISTERED_OFFER_IDS = (11, 12, 13, 14)
GOOGLE = "https://www.google.com/"


def binding(offer_id, share):
    return {"offer_id": offer_id, "share": share, "state": "active"}


class FakeKeitaro:
    def __init__(self):
        self.id = 1_000_000 + uuid4().int % 1_000_000_000
        self.stream_id = self.id + 1
        self.campaigns = {
            self.id: {
                "id": self.id,
                "name": "Тестовая",
                "alias": "route",
                "state": "active",
                "domain_id": 81,
                "group_id": "82",
                "traffic_source_id": 83,
            }
        }
        self.streams = {
            self.id: [
                {
                    "id": self.id + 2,
                    "campaign_id": self.id,
                    "name": "Google",
                    "type": "regular",
                    "schema": "redirect",
                    "position": 1,
                    "action_type": "http",
                    "action_payload": GOOGLE,
                    "filters": [{"name": "country", "mode": "accept", "payload": ["AU"]}],
                    "offers": [],
                },
                {
                    "id": self.stream_id,
                    "campaign_id": self.id,
                    "name": "Офферы",
                    "type": "default",
                    "schema": "landings",
                    "position": 2,
                    "offers": [binding(11, 34), binding(12, 33), binding(13, 33)],
                },
            ]
        }
        self.writes = []
        self.reject_update = False
        self.ignore_update = False
        self.lose_next_update_response = False
        self.lose_next_read_response = False

    @property
    def offer_stream(self):
        return self.streams[self.id][1]

    def handle(self, request):
        assert request.headers["Api-Key"] == "fixture-key"
        assert request.url.path.startswith("/admin_api/v1/")
        parts = request.url.path.removeprefix("/admin_api/v1/").split("/")
        method = request.method
        data = json.loads(request.content) if request.content else {}
        resource = parts[0]
        if method == "GET" and self.lose_next_read_response:
            self.lose_next_read_response = False
            raise httpx.ReadTimeout("transient read failure", request=request)
        if method != "GET":
            self.writes.append((method, "/".join(parts), deepcopy(data)))

        if method == "GET" and resource == "offers":
            if len(parts) == 1:
                return httpx.Response(
                    200,
                    json=[
                        {"id": offer_id, "name": f"Оффер {offer_id}", "state": "active"}
                        for offer_id in REGISTERED_OFFER_IDS
                    ],
                )
            offer_id = int(parts[1])
            if offer_id not in REGISTERED_OFFER_IDS:
                return httpx.Response(404, json={"error": "not found"})
            return httpx.Response(
                200, json={"id": offer_id, "name": f"Оффер {offer_id}", "state": "active"}
            )

        if resource == "campaigns" and method == "GET":
            if len(parts) == 1:
                assert set(request.url.params.keys()) == {"limit", "offset"}
                return httpx.Response(200, json=list(self.campaigns.values()))
            campaign_id = int(parts[1])
            if len(parts) == 3:
                return httpx.Response(200, json=self.streams[campaign_id])
            return httpx.Response(200, json=self.campaigns[campaign_id])

        if resource == "streams" and method in {"GET", "PUT"}:
            stream_id = int(parts[1])
            stream = next(
                row
                for campaign_streams in self.streams.values()
                for row in campaign_streams
                if row["id"] == stream_id
            )
            if method == "PUT":
                if self.reject_update:
                    return httpx.Response(500, json={"error": "upstream failure"})
                if not self.ignore_update:
                    stream.update(data)
                    if self.lose_next_update_response:
                        self.lose_next_update_response = False
                        raise httpx.ReadTimeout(
                            "write succeeded but reply was lost", request=request
                        )
            return httpx.Response(200, json=stream)

        pytest.fail(f"Unexpected upstream request: {method} {request.url.path}")


@pytest.fixture
def fake():
    return FakeKeitaro()


@pytest.fixture
def settings():
    return Settings(
        _env_file=None,
        keitaro_base_url="https://tracker.example",
        keitaro_api_key=SecretStr("fixture-key"),
    )


@pytest.fixture
def client(fake, settings):
    with TestClient(
        create_app(settings, keitaro_transport=httpx.MockTransport(fake.handle))
    ) as api:
        yield api


@pytest.fixture
def editor(client, fake):
    if os.environ.get("POSTGRES_DB") != "adrobot_test":
        pytest.skip("Run PostgreSQL integration tests with the Compose test profile.")
    return f"{BASE}/campaigns/{fake.id}/streams", fake, client


def read(editor):
    base, _, client = editor
    response = client.get(base)
    assert response.status_code == 200, response.text
    redirect, state = response.json()
    assert redirect["editable"] is False
    assert redirect["offers"] == []
    assert state["editable"] is True
    return state


def change(editor, state, action, offer_id, expect=200):
    base, _, client = editor
    response = client.post(
        f"{base}/{state['id']}/draft",
        json={"action": action, "offer_id": offer_id, "revision": state["revision"]},
    )
    assert response.status_code == expect, response.text
    return response.json()


def submit(editor, state, operation, expect=200):
    base, _, client = editor
    response = client.post(
        f"{base}/{state['id']}/{operation}", json={"revision": state["revision"]}
    )
    assert response.status_code == expect, response.text
    return response.json()


def by_id(state):
    return {offer["offer_id"]: offer for offer in state["offers"]}


def shares(state):
    return [offer["share"] for offer in state["offers"] if not offer["removed"]]


def test_reads_are_retried_after_a_transient_timeout(client, fake):
    fake.lose_next_read_response = True
    response = client.get(f"{BASE}/campaigns/{fake.id}")
    assert response.status_code == 200
    assert response.json()["id"] == fake.id
    assert not fake.writes


def test_campaign_and_offer_lists_remain_available_without_campaign_creation(client, fake):
    assert client.get(f"{BASE}/offers/11").json()["name"] == "Оффер 11"
    offers = client.get(f"{BASE}/offers")
    assert offers.status_code == 200
    assert [item["id"] for item in offers.json()] == list(REGISTERED_OFFER_IDS)
    assert client.get(f"{BASE}/offers/999").status_code == 404
    assert client.get(f"{BASE}/campaigns?limit=10&offset=0").json()[0]["id"] == fake.id
    assert client.post(f"{BASE}/campaigns", json={}).status_code == 405
    assert client.get(f"{BASE}/catalog").status_code == 404
    assert not fake.writes


def test_draft_cancel_publish_remove_restore_and_pin(editor):
    _, fake, _ = editor
    initial = read(editor)
    assert shares(initial) == [34, 33, 33]
    pending = change(editor, initial, "add", 14)
    assert shares(pending) == [25, 25, 25, 25]
    assert pending["dirty"] and not fake.writes
    assert by_id(read(editor))[14]["share"] == 25
    cancelled = submit(editor, pending, "cancel")
    assert not cancelled["dirty"] and 14 not in by_id(cancelled)
    pending = change(editor, cancelled, "add", 14)
    published = submit(editor, pending, "publish")
    assert not published["dirty"]
    assert fake.offer_stream["offers"] == [binding(n, 25) for n in REGISTERED_OFFER_IDS]

    pinned = change(editor, published, "toggle_pin", 11)
    assert by_id(pinned)[11]["pinned"]
    removed = change(editor, pinned, "remove", 14)
    assert by_id(removed)[14]["removed"] and by_id(removed)[14]["share"] == 0
    assert shares(removed) == [25, 38, 37]
    published = submit(editor, removed, "publish")
    assert by_id(published)[14]["removed"] and by_id(published)[11]["pinned"]
    assert 14 not in [item["offer_id"] for item in fake.offer_stream["offers"]]

    restored = change(editor, read(editor), "restore", 14)
    assert shares(restored) == [25, 25, 25, 25]
    assert not by_id(restored)[14]["removed"]
    assert not submit(editor, restored, "publish")["dirty"]


def test_unpin_rebalances_only_unpinned_offers_without_publishing(editor):
    _, fake, _ = editor
    state = change(editor, read(editor), "toggle_pin", 11)
    state = change(editor, state, "toggle_pin", 12)
    state = change(editor, state, "add", 14)
    assert shares(state) == [34, 33, 17, 16]

    state = change(editor, state, "toggle_pin", 11)
    assert shares(state) == [23, 33, 22, 22]
    assert not by_id(state)[11]["pinned"] and by_id(state)[12]["pinned"]
    assert state["dirty"] and not fake.writes
    assert shares(read(editor)) == shares(state)


def test_detached_offers_move_to_end_and_can_be_restored_before_publishing(editor):
    state = change(editor, read(editor), "remove", 13)
    state = change(editor, state, "add", 14)
    state = change(editor, state, "remove", 12)
    state = change(editor, state, "remove", 14)

    detached = [offer for offer in read(editor)["offers"] if offer["removed"]]
    assert [(offer["offer_id"], offer["share"]) for offer in detached] == [
        (13, 0), (12, 0), (14, 0)
    ]

    restored = change(editor, state, "restore", 14)
    assert by_id(restored)[14]["removed"] is False
    assert shares(restored) == [50, 50]
    assert read(editor)["dirty"]


def test_fetch_archives_external_removals_and_preserves_conflicting_draft(editor):
    _, fake, _ = editor
    initial = read(editor)
    fake.offer_stream["offers"] = [binding(11, 50), binding(12, 50)]
    synced = read(editor)
    assert synced["revision"] > initial["revision"]
    assert by_id(synced)[13]["removed"] and by_id(synced)[13]["share"] == 0
    draft = change(editor, synced, "restore", 13)
    fake.offer_stream["offers"] = [binding(11, 100)]
    latest = read(editor)
    assert latest["dirty"] and latest["conflicted"]
    assert by_id(latest)[13]["removed"] is False
    assert latest["revision"] > draft["revision"]
    assert "Keitaro" in submit(editor, latest, "publish", 409)["detail"]
    assert fake.writes == []
    reset = submit(editor, latest, "cancel")
    assert not reset["dirty"] and not reset["conflicted"]
    assert by_id(reset)[12]["removed"] and by_id(reset)[13]["removed"]
    assert shares(reset) == [100]


def test_failed_update_keeps_draft_and_empty_list_can_be_published(editor):
    _, fake, _ = editor
    fake.offer_stream["offers"] = [binding(11, 100)]
    initial = read(editor)
    draft = change(editor, initial, "remove", 11)
    fake.reject_update = True
    submit(editor, draft, "publish", 502)
    assert read(editor)["dirty"]
    fake.reject_update = False
    fake.ignore_update = True
    submit(editor, draft, "publish", 502)
    assert read(editor)["dirty"]
    fake.ignore_update = False
    published = submit(editor, draft, "publish")
    assert not published["dirty"]
    assert fake.offer_stream["offers"] == []
    assert by_id(published)[11]["removed"]
    assert fake.writes[-1][2] == {"schema": "landings", "offers": []}
    restored = change(editor, published, "restore", 11)
    assert shares(restored) == [100]


def test_two_edits_from_same_revision_do_not_lose_updates(editor):
    _, _, client = editor
    state = read(editor)
    base = editor[0]

    def edit(offer_id):
        return client.post(
            f"{base}/{state['id']}/draft",
            json={"action": "toggle_pin", "offer_id": offer_id, "revision": state["revision"]},
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        assert sorted(executor.map(edit, [11, 12])) == [200, 409]
    assert sum(offer["pinned"] for offer in read(editor)["offers"]) == 1


def test_a_saved_draft_survives_application_restart(editor, settings):
    base, fake, _ = editor
    draft = change(editor, read(editor), "add", 14)
    with TestClient(
        create_app(settings, keitaro_transport=httpx.MockTransport(fake.handle))
    ) as restarted:
        response = restarted.get(base)
    assert response.status_code == 200
    assert response.json()[1] == draft


def test_history_records_confirmed_publications_and_filters_before_pagination(editor):
    _, fake, client = editor
    path = f"{BASE}/campaigns/{fake.id}/history"

    def history(**filters):
        response = client.get(path, params=filters)
        assert response.status_code == 200, response.text
        return response.json()

    draft = change(editor, read(editor), "add", 14)
    assert not history()["entries"]
    fake.reject_update = True
    submit(editor, draft, "publish", 502)
    assert not history()["entries"]

    fake.reject_update = False
    published = submit(editor, draft, "publish")
    pin_draft = change(editor, published, "toggle_pin", 11)
    pinned = submit(editor, pin_draft, "publish")
    assert len(fake.writes) == 2

    first_page = history(limit=1)
    latest = first_page["entries"][0]
    assert latest["stream_id"] == fake.stream_id
    assert latest["stream_name"] == "Офферы"
    assert latest["changes"] == [{
        "offer_id": 11,
        "name": "Оффер 11",
        "actions": ["pinned"],
        "before": {"share": 25, "pinned": False, "state": "active"},
        "after": {"share": 25, "pinned": True, "state": "active"},
    }]
    second_page = history(limit=1, cursor=first_page["next_cursor"])
    oldest = second_page["entries"][0]
    assert second_page["next_cursor"] is None
    assert oldest["changes"][-1]["actions"] == ["added"]
    assert oldest["changes"][-1]["before"] is None
    assert oldest["changes"][0]["before"]["share"] == 34
    assert history(descending=False)["entries"] == [oldest, latest]
    assert history(offer="#14", action="added", stream="офферы")["entries"] == [oldest]
    assert not history(offer="14", action="share")["entries"]
    assert history(from_date=latest["published_at"])["entries"] == [latest]

    other_id = fake.id + 10
    fake.campaigns[other_id] = {**fake.campaigns[fake.id], "id": other_id}
    assert not client.get(f"{BASE}/campaigns/{other_id}/history").json()["entries"]

    detached = submit(editor, change(editor, pinned, "remove", 14), "publish")
    submit(editor, change(editor, detached, "restore", 14), "publish")
    assert len(history(action="removed")["entries"]) == 1
    restored = history(offer="14", action="restored")["entries"][0]
    assert restored["changes"][-1]["actions"] == ["restored"]


def test_publish_confirms_success_after_keitaro_loses_the_write_response(editor):
    _, fake, _ = editor
    draft = change(editor, read(editor), "add", 14)
    fake.lose_next_update_response = True
    published = submit(editor, draft, "publish")
    assert shares(published) == [25, 25, 25, 25]
    assert not published["dirty"] and not published["conflicted"]
    assert len(fake.writes) == 1
