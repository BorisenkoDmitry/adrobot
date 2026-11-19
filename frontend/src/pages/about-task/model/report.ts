export type ReportRow = readonly [code: string, ru: string, en: string]

export const architecture: ReportRow[] = [
  ['React', 'Список кампаний, редактор потоков и история.', 'Campaign list, stream editor and history.'],
  ['Nginx → FastAPI', 'Запросы интерфейса, проверка и публикация изменений.', 'App requests, validation and publishing.'],
  ['PostgreSQL', 'Черновики, снимки, откреплённые офферы и журнал.', 'Drafts, snapshots, detached offers and history.'],
  ['Keitaro', 'Кампании, потоки, каталог офферов и опубликованные доли.', 'Campaigns, streams, offer catalog and live shares.'],
]

export const features: ReportRow[] = [
  ['campaigns',
    'Список кампаний с пагинацией и поиском по имени, алиасу или ID на загруженной странице. Отдельное поле открывает кампанию по точному ID.',
    'Paginated campaigns with a filter by name, alias or ID on the loaded page. A separate field opens a campaign by its exact ID.'],
  ['streams',
    'Редактор показывает потоки со схемой landings, в том числе пустые. Из редактора можно обновить данные Keitaro, открыть кампанию в админке, посмотреть все офферы или историю.',
    'The editor shows streams using the landings schema, including empty ones. You can refresh from Keitaro, open the campaign in its admin panel, browse all offers or view history.'],
  ['offers',
    'Офферы выбираются в списке с поиском по ID. После подтверждения откреплённый оффер переходит в конец списка с долей 0% и действием «Вернуть».',
    'Select offers from a list with ID search. After confirmation, a detached offer moves to the end with a 0% share and a Restore action.'],
  ['shares',
    'Доли активных офферов распределяются целыми процентами до 100%. Закреплённые доли сохраняются, остаток округления распределяется по порядку.',
    'Active offers are allocated whole percentage points totaling 100%. Pinned shares are preserved and rounding remainders are assigned in order.'],
  ['drafts',
    'Изменения сначала сохраняются как черновик. Его можно отменить или опубликовать в Keitaro. Если состав потока изменился извне, редактор обнаруживает конфликт.',
    'Changes are first saved as a draft. You can cancel it or publish it to Keitaro. The editor detects conflicts when the stream changes externally.'],
  ['history',
    'Успешные публикации записываются в историю. Таблица поддерживает фильтры, сортировку по времени и курсорную пагинацию.',
    'Successful publications are recorded in history. The table supports filters, time sorting and cursor pagination.'],
  ['preferences',
    'Светлая и тёмная темы, русский и английский языки. Выбор хранится в браузере.',
    'Light and dark themes, with Russian and English. Preferences are stored in the browser.'],
  ['key',
    'В «Состоянии сервиса» можно проверить ключ Keitaro, сохранить его в зашифрованном виде и показать исходное значение по нажатию на глазик.',
    'Service status lets you test the Keitaro key, save it encrypted and reveal it using the eye button.'],
]

export const database = [
  {
    name: 'stream_edits',
    purpose: ['Черновики и состояние редактора для каждого потока.', 'Drafts and editor state for each stream.'],
    columns: [
      ['campaign_id, stream_id · integer', 'Составной первичный ключ из ID Keitaro.', 'Composite primary key made up of Keitaro IDs.'],
      ['published · jsonb', 'Опубликованный состав с именами, долями, закреплениями и архивом.', 'Published offers with names, shares, pins and archived entries.'],
      ['remote_offers · jsonb', 'Снимок Keitaro для обнаружения конфликтов.', 'Keitaro snapshot for conflict detection.'],
      ['draft · jsonb', 'Черновой состав. NULL означает, что черновика нет.', 'Draft offers. NULL means there is no draft.'],
      ['revision · integer', 'Версия для проверки параллельных правок.', 'Revision for checking concurrent edits.'],
      ['conflicted · boolean', 'Признак расхождения с Keitaro.', 'Flags a mismatch with Keitaro.'],
    ] satisfies ReportRow[],
  },
  {
    name: 'stream_publications',
    purpose: ['Журнал подтверждённых публикаций с изменениями.', 'Log of confirmed publications that changed a stream.'],
    columns: [
      ['id · bigint identity', 'Первичный ключ и курсор пагинации.', 'Primary key and pagination cursor.'],
      ['campaign_id, stream_id · integer', 'ID кампании и потока из Keitaro.', 'Keitaro campaign and stream IDs.'],
      ['stream_name · text', 'Название потока на момент публикации.', 'Stream name at the time of publication.'],
      ['published_at · timestamptz', 'Время записи подтверждённого изменения.', 'Time the confirmed change was recorded.'],
      ['changes · jsonb', 'Действия, состояния до и после, доли и закрепления офферов.', 'Actions, before and after states, offer shares and pins.'],
    ] satisfies ReportRow[],
  },
  {
    name: 'keitaro_credentials',
    purpose: ['Один сохранённый ключ на экземпляр Adrobot.', 'One saved key per Adrobot instance.'],
    columns: [
      ['id · smallint', 'Первичный ключ. Ограничение допускает только значение 1.', 'Primary key constrained to the value 1.'],
      ['encrypted_api_key · text', 'Токен Fernet. Материал шифрования хранится в окружении сервера.', 'Fernet token. The encryption key is held in the server environment.'],
    ] satisfies ReportRow[],
  },
] as const

const campaign = '/campaigns/{campaign_id}'
const streams = `${campaign}/streams`
const stream = `${streams}/{stream_id}`

export const adrobotApi: ReportRow[] = [
  ['GET /campaigns', 'Страница кампаний. Параметры limit (50 по умолчанию, до 100) и offset.', 'Campaign page with limit (default 50, max 100) and offset.'],
  [`GET ${campaign}`, 'Карточка кампании по ID и ссылка в админку.', 'Find a campaign by ID and return its admin link.'],
  ['GET /offers', 'Каталог для селекта и окна «Все офферы».', 'Offer catalog for the picker and the All offers dialog.'],
  ['GET /offers/{offer_id}', 'Один оффер по ID.', 'Find an offer by ID.'],
  [`GET ${streams}`, 'Загружает потоки из Keitaro, сверяет их с PostgreSQL и возвращает состав, состояние и версию.', 'Loads streams from Keitaro, reconciles them with PostgreSQL and returns their offers, state and revision.'],
  [`POST ${stream}/draft`, 'Принимает revision, offer_id и действие add, remove, restore или toggle_pin.', 'Accepts revision, offer_id and one of the add, remove, restore or toggle_pin actions.'],
  [`POST ${stream}/cancel`, 'Принимает revision, сбрасывает черновик и перечитывает состояние Keitaro.', 'Accepts revision, discards the draft and reads the latest Keitaro state.'],
  [`POST ${stream}/publish`, 'Принимает revision, отправляет состав, проверяет результат и записывает историю.', 'Accepts revision, sends the offer list, verifies the result and records history.'],
  [`GET ${campaign}/history`, 'Фильтры stream, offer, action, from_date, until_date. Сортировка descending и пагинация limit, cursor с next_cursor в ответе.', 'Filters stream, offer, action, from_date and until_date. Sort with descending and paginate with limit and cursor. The response contains next_cursor.'],
  ['GET /health/live', 'Проверяет, что FastAPI отвечает.', 'Checks that FastAPI responds.'],
  ['GET /health/ready', 'Проверяет подключение к PostgreSQL.', 'Checks the PostgreSQL connection.'],
  ['GET /settings/keitaro', 'Возвращает источник ключа и доступность сохранения.', 'Returns the key source and whether encrypted storage is available.'],
  ['PUT /settings/keitaro', 'Шифрует и сохраняет ключ для всех запросов этого экземпляра.', 'Encrypts and saves the key used by this Adrobot instance.'],
  ['POST /settings/keitaro/test', 'Проверяет введённый или действующий ключ чтением списка кампаний.', 'Tests the entered or active key by reading campaigns.'],
  ['POST /settings/keitaro/reveal', 'Возвращает сохранённый ключ только по запросу с Cache-Control: no-store.', 'Returns the saved key on demand with Cache-Control: no-store.'],
]

export const keitaroApi: ReportRow[] = [
  ['GET /campaigns\nGET /campaigns/{id}', 'Список и карточка кампании. Для истории карточка подтверждает доступ и даёт название кампании.', 'Campaign list and detail. The detail request confirms access and supplies the campaign name for history.'],
  ['GET /campaigns/{id}/streams', 'Потоки и привязки офферов для сверки.', 'Streams and their offer assignments for reconciliation.'],
  ['GET /offers\nGET /offers/{id}', 'Каталог и проверка доступности оффера при добавлении или возврате.', 'Catalog and offer availability checks when adding or restoring an offer.'],
  ['GET /streams/{id}', 'Текущий состав до операции и повторная проверка после записи.', 'Reads the current offers before editing and verifies them after updating.'],
  ['PUT /streams/{id}', 'Отправляет полный активный состав с offer_id, share и state.', 'Writes the complete active list with offer_id, share and state.'],
]

export const publishExample = JSON.stringify({
  schema: 'landings',
  offers: [{ offer_id: 123, share: 100, state: 'active' }],
}, null, 2)

export const backendFiles: ReportRow[] = [
  ['app/main.py', 'Запуск FastAPI, инициализация HTTP-клиента и SQLAlchemy, обработчики ошибок.', 'FastAPI setup, HTTP client and SQLAlchemy initialization, and error handlers.'],
  ['app/core/config.py\napp/api/dependencies.py', 'Окружение, подключение к Keitaro и зависимости маршрутов.', 'Environment, Keitaro connection and route dependencies.'],
  ['app/api/v1/', 'Маршруты кампаний, потоков, истории, состояния сервиса и ключа.', 'Routes for campaigns, streams, history, service health and the API key.'],
  ['app/keitaro/client.py\napp/keitaro/schemas.py', 'Запросы к Admin API, проверка ответов и обработка ошибок.', 'Admin API requests, response validation and error handling.'],
  ['app/keitaro/credentials.py', 'Модель, шифрование и сохранение ключа.', 'API key model, encryption and storage.'],
  ['app/modules/editor/domain.py', 'Алгоритм долей, закрепления и архива.', 'Share allocation, pins and archived offers.'],
  ['app/modules/editor/service.py', 'Сверка с Keitaro, правки черновика, отмена и публикация.', 'Keitaro reconciliation, draft edits, cancellation and publishing.'],
  ['app/modules/editor/history.py', 'Разница между состояниями, журнал, фильтры и курсор.', 'Diffs, publication history, filters and cursor.'],
  ['app/modules/editor/model.py\napp/modules/editor/schemas.py', 'Модели таблиц редактора, входные и выходные данные.', 'Editor database models, request and response schemas.'],
  ['app/db/\nmigrations/versions/', 'Сессии SQLAlchemy и миграции редактора, истории и ключа.', 'SQLAlchemy sessions and migrations for the editor, history and key.'],
  ['tests/test_api.py\nDockerfile\npyproject.toml', 'Интеграционные тесты с отдельной PostgreSQL, сборка и зависимости.', 'Integration tests with a separate PostgreSQL, image build and dependencies.'],
]

export const frontendFiles: ReportRow[] = [
  ['main.tsx\napp/ui/', 'Вход React, шрифты, провайдеры, навигация и выбор языка.', 'React entry point, fonts, providers, navigation and the language selector.'],
  ['app/providers/\napp/model/\napp/styles/', 'React Router, TanStack Query, Redux Toolkit, тема и общие стили.', 'React Router, TanStack Query, Redux Toolkit, theme and shared styling.'],
  ['pages/campaign-list/', 'Таблица, поиск с задержкой, пагинация и переход по ID.', 'Campaign table, debounced search, pagination and opening by ID.'],
  ['pages/campaign-streams/', 'Карточки редактируемых потоков, сверка и каталог офферов.', 'Editable stream cards, tracker refresh and the offer catalog.'],
  ['pages/campaign-history/', 'Таблица публикаций и фильтры, сортировка и курсоры по кампаниям.', 'Publication table and per-campaign filters, sort order and cursors.'],
  ['pages/overview/\npages/not-found/\npages/about-task/', 'Состояние сервиса, неизвестный адрес и этот отчёт.', 'Service status, the not-found screen and this report.'],
  ['features/edit-stream-offers/', 'Черновики, открепление, возврат, закрепление и публикация.', 'Drafts, detach and restore, pins and publishing.'],
  ['features/manage-keitaro-key/', 'Форма ключа, проверка, сохранение и видимость значения.', 'Key form, testing, saving and visibility.'],
  ['entities/campaign/\nentities/stream/\nentities/offer/', 'Модели, запросы и кеш кампаний, потоков и офферов.', 'Models, requests and cache keys for campaigns, streams and offers.'],
  ['shared/api/\nshared/i18n/\nshared/ui/\nshared/lib/', 'HTTP-клиент, переводы, общие компоненты и утилиты.', 'HTTP client, localization, shared components and utilities.'],
]

export const runCommands = [
  'docker compose up --build -d --wait',
  'docker compose exec api alembic current',
  'docker compose --profile test run --rm --build tests',
].join('\n')
