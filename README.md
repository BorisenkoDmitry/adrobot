# Adrobot

Тестовое задание Adrobot. Приложение открывает существующую кампанию Keitaro, показывает её потоки и редактирует состав и доли офферов. Бэкенд использует FastAPI, SQLAlchemy 2, PostgreSQL и Alembic. Фронтенд собран на React и TypeScript по FSD с React Router, Redux Toolkit, TanStack Query, TanStack Table, Tailwind и shadcn/ui.

[Технический отчёт в HTML](docs/adrobot-report.html) описывает таблицы, связи, API и карту файлов.

## Запуск через Docker

Нужен Docker с Linux-контейнерами и Docker Compose v2.

```powershell
git clone https://github.com/BorisenkoDmitry/adrobot.git
Set-Location adrobot
Copy-Item .env.example .env
```

Заполните `.env`. Для просмотра нужны права чтения кампаний, потоков и офферов. Для публикации ключу нужны права изменения потоков.

| Переменная | Что указать |
| --- | --- |
| `KEITARO_BASE_URL` | HTTPS-адрес трекера без `/admin` и пути API |
| `KEITARO_API_KEY` | Ключ из «Профиль → API ключи» с доступом к нужным кампаниям, потокам и офферам |
| `WEB_PORT`, `API_PORT` | Локальные порты, по умолчанию 5173 и 8000 |

```powershell
docker compose up --build -d --wait
docker compose ps -a
```

- Интерфейс: [localhost:5173](http://localhost:5173)
- Swagger: [localhost:8000/docs](http://localhost:8000/docs)
- Проверка API и базы: [readiness](http://localhost:5173/api/v1/health/ready)

Compose дожидается PostgreSQL, применяет миграции Alembic сервисом `migrate` и запускает FastAPI и Nginx. Код завершения сервиса миграций 0 означает успех. Данные PostgreSQL находятся в томе `postgres_data`. Веб и API слушают локальные порты.

Ключ Keitaro использует FastAPI. Локальные `.env` и `compose.override.yaml` исключены из Git. На Linux для копирования образца настроек можно использовать `cp .env.example .env`.

## Миграции PostgreSQL

- `0001_baseline` — начальная ревизия Alembic.
- `0002_stream_edits` — черновики, версии, закрепления и архивы потока.
- `0003_stream_publications` — журнал публикаций и составной индекс `(campaign_id, id)` для чтения истории по курсору.

Для установки и обновления используйте `docker compose up --build -d --wait`. Текущую ревизию можно проверить командой `docker compose exec api alembic current`.

## Сценарии

1. Откройте «Потоки» нужной кампании. Кнопка «Загрузить из Keitaro» обновляет их список. В потоке с офферами доступны поиск по ID, добавление, открепление, восстановление и закрепление доли.
2. Изменения хранятся в PostgreSQL как черновик. «Отменить правки» возвращает опубликованный состав. «Отправить в Keitaro» подтверждает изменения только после проверки ответа трекера. После обновления списка офферы, откреплённые напрямую в Keitaro, попадают в локальный архив.
3. При добавлении, откреплении, восстановлении или снятии закрепления остаток до ста процентов делится целыми долями между активными офферами без закрепления. Если свободной доли не хватает, снимите закрепление. Если в Keitaro изменили состав или доли после начала черновика, редактор покажет конфликт и сохранит черновик до его отмены.
4. «История» показывает подтверждённые публикации Adrobot по кампании и доли изменённых офферов до и после. Записи можно отфильтровать по периоду, потоку, офферу и типу изменения, затем сопоставить время публикации с отчётами Keitaro.

Keitaro хранит кампании, конфигурацию потоков и опубликованные привязки. PostgreSQL хранит снимки для сверки, черновики, архив, закрепления и историю. Adrobot проверяет версию черновика и сверяет поток с Keitaro перед публикацией. Запись в Keitaro подтверждается повторным чтением. История пополняется по мере новых подтверждённых публикаций через Adrobot.

## Проверки

Интеграционные тесты используют отдельный PostgreSQL в Docker и имитацию API Keitaro. Они проверяют чтение кампаний и офферов, ошибки публикации, черновики, восстановление, перерасчёт и конфликты, включая два одновременных действия.

```powershell
docker compose --profile test run --rm --build tests
docker compose --profile test stop test-db
```

Проверки для разработки:

```powershell
Set-Location backend
uv sync --locked
uv run ruff check .
Set-Location ../frontend
npm ci
npm run lint
npm run build
```

Для фронтенда с hot reload поднимите сервис API и его зависимости, затем запустите Vite из `frontend/`.

```powershell
docker compose up -d --wait api
Set-Location frontend
npm run dev
```

Vite проксирует `/api` на локальный FastAPI. Если меняете порт backend, задайте Vite переменную `API_PROXY_TARGET`.

## Архитектура frontend

- `app` подключает маршруты и провайдеры и собирает Redux store через `combineSlices`.
- `pages` содержит экраны, таблицы и модели списка кампаний и истории. Redux хранит их фильтры, сортировку и текущую страницу.
- `features/edit-stream-offers` содержит действия редактора потока и хук, который обновляет кеш после операций.
- `entities` описывает кампании, потоки и офферы, а `shared` предоставляет HTTP-клиент и общие компоненты. Запросы и их кеш остаются в TanStack Query. Состояние диалогов и селекта живёт рядом с компонентами.

## Архитектура backend

- `app/api/v1` — HTTP-маршруты и зависимости.
- `app/modules/editor` — расчёт долей, черновики, сверка, публикация и история изменений.
- `app/keitaro` — типы и HTTP-клиент [Keitaro Admin API v1](https://admin-api.docs.keitaro.io/).
- `app/db` и `migrations` — сессии PostgreSQL и миграции.
