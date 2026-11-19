import logging
from typing import Any

import httpx
from pydantic import TypeAdapter, ValidationError

from app.keitaro.schemas import Campaign, Offer, RemoteOffer, RemoteStream

logger = logging.getLogger(__name__)


class KeitaroError(Exception):
    def __init__(self, status_code: int, public_message: str) -> None:
        super().__init__(public_message)
        self.status_code = status_code
        self.public_message = public_message


class KeitaroClient:
    def __init__(
        self, http: httpx.AsyncClient, *, configured: bool = True, api_key: str | None = None
    ) -> None:
        self.http = http
        self.configured = configured
        self.api_key = api_key

    async def _request[T](
        self,
        method: str,
        path: str,
        result: Any,
        *,
        params: dict | None = None,
        body: dict | None = None,
    ) -> T:
        if not self.configured:
            raise KeitaroError(503, "Подключение к Keitaro не настроено.")
        response = await self._send(method, path, params=params, body=body)

        if not response.is_success:
            logger.warning("Keitaro %s %s returned %s", method, path, response.status_code)
            if response.status_code in (401, 403):
                raise KeitaroError(403, "Keitaro отклонил запрос. Проверьте права ключа.")
            if response.status_code == 404:
                raise KeitaroError(404, "Объект не найден в Keitaro.")
            if response.status_code == 402:
                raise KeitaroError(503, "Admin API недоступен в текущей редакции Keitaro.")
            if response.status_code == 429:
                raise KeitaroError(503, "Keitaro ограничил частоту запросов.")
            if response.status_code in (400, 406, 409, 422):
                raise KeitaroError(422, "Keitaro не принял параметры операции.")
            raise KeitaroError(502, "Keitaro вернул ошибку.")

        try:
            return TypeAdapter(result).validate_json(response.content)
        except (ValidationError, ValueError) as exc:
            logger.warning("Unexpected Keitaro response for %s %s", method, path)
            raise KeitaroError(502, "Keitaro вернул данные в неожиданном формате.") from exc

    async def _send(
        self, method: str, path: str, *, params: dict | None, body: dict | None
    ) -> httpx.Response:
        headers = {"Api-Key": self.api_key} if self.api_key is not None else None
        for attempt in range(2 if method == "GET" else 1):
            try:
                return await self.http.request(
                    method, path, params=params, json=body, headers=headers
                )
            except httpx.RequestError as exc:
                if method == "GET" and attempt == 0:
                    logger.info("Retrying read from Keitaro: %s", path)
                    continue
                if isinstance(exc, httpx.TimeoutException):
                    raise KeitaroError(504, "Keitaro не ответил вовремя.") from exc
                raise KeitaroError(502, "Не удалось связаться с Keitaro.") from exc
        raise AssertionError("Keitaro request has no outcome")

    async def campaigns(self, limit: int, offset: int) -> list[Campaign]:
        return await self._request(
            "GET", "campaigns", list[Campaign], params={"limit": limit, "offset": offset}
        )

    async def campaign(self, campaign_id: int) -> Campaign:
        return await self._request("GET", f"campaigns/{campaign_id}", Campaign)

    async def offers(self) -> list[Offer]:
        return await self._request("GET", "offers", list[Offer])

    async def offer(self, offer_id: int) -> Offer:
        return await self._request("GET", f"offers/{offer_id}", Offer)

    async def streams(self, campaign_id: int) -> list[RemoteStream]:
        return await self._request("GET", f"campaigns/{campaign_id}/streams", list[RemoteStream])

    async def stream(self, stream_id: int) -> RemoteStream:
        return await self._request("GET", f"streams/{stream_id}", RemoteStream)

    async def set_stream_offers(self, stream_id: int, offers: list[RemoteOffer]) -> None:
        await self._request(
            "PUT",
            f"streams/{stream_id}",
            RemoteStream,
            body={"schema": "landings", "offers": [offer.model_dump() for offer in offers]},
        )
