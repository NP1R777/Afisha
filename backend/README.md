# Afisha Backend

Бэкенд приложения для афиши, построенный на FastAPI.

## Требования

- Python 3.10+
- PostgreSQL
- Docker (опционально)

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # для Linux/Mac
# или
.\venv\Scripts\activate  # для Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл .env на основе .env.example:
```bash
cp .env.example .env
```

4. Настройте переменные окружения в файле .env

## Запуск приложения

### Локальный запуск

```bash
uvicorn app.main:app --reload
```

Приложение будет доступно по адресу: http://localhost:8000

### Запуск через Docker

```bash
docker-compose up --build
```

## Миграции базы данных

### Создание новой миграции

```bash
alembic revision --autogenerate -m "описание изменений"
```

### Применение миграций

```bash
alembic upgrade head
```

### Откат миграций

```bash
alembic downgrade -1  # откат на одну миграцию назад
```

## Создание и восстановление дампа БД

Для переноса проекта на другую машину можно сначала восстановить БД из дампа, а затем запускать backend.

### 1) Создание дампа

Скрипт читает `DB_*` переменные из `.env` (или из переменных окружения) и формирует SQL-дамп с командами создания БД.

```bash
python scripts/create_db_dump.py
```

По умолчанию дамп сохраняется в `backend/db_dumps/<DB_NAME>_<timestamp>.sql`.

Дополнительно:

```bash
python scripts/create_db_dump.py --env-file .env --output-dir ./db_dumps --dump-name afisha_prod
```

### 2) Восстановление БД из дампа

На машине, где нужно поднять проект:

1. Скопируйте файл дампа.
2. Подготовьте `.env` с корректными `DB_*` параметрами.
3. Выполните восстановление:

```bash
python scripts/restore_db_dump.py --dump-file ./db_dumps/afisha_prod.sql
```

По умолчанию восстановление выполняется через служебную БД `postgres` (`--maintenance-db postgres`).

### 3) Очистка выбранных таблиц

Если нужно быстро очистить только часть таблиц в БД, используйте скрипт:

```bash
python scripts/clear_db_tables.py --tables parsed_event events news
```

По умолчанию применяется режим `truncate` (`RESTART IDENTITY CASCADE`).

Для безопасной проверки SQL без выполнения:

```bash
python scripts/clear_db_tables.py --tables parsed_event events --dry-run
```

Для режима `DELETE FROM`:

```bash
python scripts/clear_db_tables.py --tables parsed_event --mode delete --yes
```

### 4) Запуск backend после восстановления

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

`alembic upgrade head` можно оставлять в процессе запуска — если схема уже актуальна, новые миграции просто не применятся.

## Документация API

После запуска приложения доступна автоматически сгенерированная документация:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Парсер мероприятий (staging)

В проект добавлен ручной парсер источников, который сохраняет данные в отдельную таблицу `parsed_event`.

### Миграция

Перед использованием обязательно примените миграции:

```bash
alembic upgrade head
```

### Доступные endpoint'ы

- `GET /parser/sources` — список подключенных источников;
- `POST /parser/run` — запуск парсинга вручную;
- `POST /parser/distribute` — перенос записей из `parsed_event` в `events/news` по rule-based классификации;
- `POST /parser/categories/backfill` — ручная автопривязка категорий для `events` без категорий;
- `POST /parser/images/backfill` — ручная загрузка `events.pictures_main` в MinIO (batch-режим);
- `GET /parser/events` — просмотр собранных событий из staging-таблицы.

При переносе:
- `unknown` остаются в `parsed_event` со статусом `new`;
- успешно перенесенные записи помечаются `deleted_at`, и удаляются физически после 3 дней при следующем запуске переноса;
- дубли в целевых таблицах удаляются из `parsed_event` сразу (без soft delete).
- при переносе в `events` автоматически создаются связи в `event_groups_event`, если по правилам удалось определить категорию.
- при `POST /parser/run` изображения из `pictures_main` загружаются в MinIO. Если загрузка неуспешна, сохраняется fallback на исходную внешнюю ссылку.

### Подключенные источники

- `northdrama` — Заполярный театр драмы;
- `gck` — Городской центр культуры;
- `norilsk_official` — Официальный сайт Норильска;
- `sg_afisha` — Афиша Северного города (reserve);
- `cinema_arthall` — Кинотеатр Арт-Холл;
- `cinema_rodina` — Кинотеатр Родина;
- `arena_norilsk` — ТРЦ Арена-Норильск;
- `museum_norilsk_vmuzey` — Музей Норильска (ВМузей);
- `gallery_norilsk_vmuzey` — Художественная галерея (ВМузей);
- `talnah_museum_vmuzey` — Талнахский филиал МВК «Музей Норильска» (ВМузей);
- `norilsk_art_college_vk` — Норильский колледж искусств (VK, первые 20 постов);
- `talnah_dshi_news` — Талнахская детская школа искусств (раздел Новости);
- `nordshi_afisha` — Норильская детская школа искусств (разделы Афиша → Концерты и Афиша → События).

### Дополнительно по новым источникам

- `norilsk_art_college_vk` работает в режиме HTML-парсинга (без API-ключа).
- Если VK отдает динамический shell/anti-bot вместо постов, источник вернет ошибку парсинга.
- Источники `vmuzey.com` могут быть защищены anti-bot challenge. В таком случае можно передать proxy/cookies через настройки окружения.
- Для vmuzey-источников добавлен HTML fallback через страницу афиши Музея Норильска (`https://norilskmuseum.ru/afisha/`), если `vmuzey.com` временно недоступен из-за anti-bot.

### Переменные окружения для внешних источников парсинга

```bash
# vmuzey anti-bot bypass (опционально)
VMUZEY_PROXY=
VMUZEY_COOKIES=
VMUZEY_USER_AGENT=

# MinIO images
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=afisha-images
MINIO_SECURE=false
MINIO_PUBLIC_BASE_URL=http://localhost:9000
MINIO_MAX_IMAGE_SIZE_MB=10
MINIO_REQUEST_TIMEOUT_SEC=30
```

- `VMUZEY_PROXY` — URL прокси в формате `http://user:pass@host:port`;
- `VMUZEY_COOKIES` — cookie-строка вида `name=value; name2=value2`;
- `VMUZEY_USER_AGENT` — пользовательский User-Agent для запросов к vmuzey.
- `MINIO_PUBLIC_BASE_URL` — публичная база URL для картинок, которую получает фронт.
- разрешены MIME: `image/jpeg`, `image/png`, `image/webp`, максимальный размер файла: `10 MB`.

### Пример запуска парсинга

```bash
curl -X POST "http://localhost:8000/parser/run" \
  -H "Content-Type: application/json" \
  -d '{
    "source_keys": ["northdrama", "gck", "norilsk_official"],
    "include_reserve": false,
    "max_events_per_source": 100
  }'
```

## AI-ассистент (Mistral + Milvus)

В backend добавлен модуль ассистента:

- `POST /assistant/chat` — диалог с ассистентом (строгий JSON-ответ);
- `POST /assistant/reindex` — ручная переиндексация `events` в Milvus.

Основная логика:

1. Ассистент через Mistral определяет intent (`afisha_search` или `general_chat`).
2. Для запросов по афише выполняется семантический поиск по Milvus.
3. Затем применяются фильтры (категория, дата, время суток, город, цена, организация, возраст).
4. Возвращается строгий JSON с полями `intent`, `filters`, `matches`, `fallback_level`, `warnings`.

### Автообновление индекса

После каждого вызова `POST /parser/distribute` backend автоматически запускает синхронизацию `events` в Milvus.

### Переменные окружения

```bash
# Mistral
MISTRAL_API_KEY=
MISTRAL_API_BASE_URL=https://api.mistral.ai/v1
MISTRAL_CHAT_MODEL=mistral-large-latest
MISTRAL_EMBEDDING_MODEL=mistral-embed

# Assistant
ASSISTANT_EMBEDDING_DIM=1024
ASSISTANT_EMBEDDING_BATCH_SIZE=32
ASSISTANT_SEMANTIC_LIMIT=80

# Milvus
MILVUS_URI=
MILVUS_HOST=localhost
MILVUS_PORT=19530
MILVUS_USER=
MILVUS_PASSWORD=
MILVUS_DB_NAME=default
MILVUS_COLLECTION_NAME=afisha_events
```

### Запуск Milvus и Attu (отдельный compose)

Для векторной БД используйте новый compose (основной `docker-compose.yml` не изменяется):

```bash
docker compose -f docker-compose.milvus.yml up -d
```

После старта:

- Milvus gRPC: `localhost:19530`
- Attu UI: `http://localhost:8001`

## Разработка

1. Создайте новую ветку для разработки
2. Внесите изменения
3. Создайте миграции, если необходимо
4. Напишите тесты
5. Создайте pull request

## Процесс разработки в GitLab

### Структура веток

- `prod` (prod) - основная ветка для продакшена
  - Прямые пуши запрещены
  - Слияние только через MR (Merge Request)
  - Принять MR может только мейнтейнер
- `dev` - ветка разработки
  - Прямые пуши запрещены
  - Слияние только через MR
  - Разработчики могут создавать MR в эту ветку

### Процесс разработки новой фичи

1. Создание новой ветки от dev:
```bash
# Переключение на ветку dev
git checkout dev

# Получение последних изменений
git pull origin dev

# Создание новой ветки для фичи
git checkout -b feature/название-фичи
```

2. Разработка фичи:
```bash
# Добавление изменений
git add .

# Создание коммита
git commit -m "feat: описание изменений"

# Отправка ветки в репозиторий
git push origin feature/название-фичи
```

3. Создание Merge Request в GitLab:
   - Откройте GitLab в браузере
   - Перейдите в раздел "Merge Requests"
   - Нажмите "New merge request"
   - Выберите:
     - Source branch: ваша ветка feature/название-фичи
     - Target branch: dev
   - Заполните:
     - Title: краткое описание изменений
     - Description: подробное описание изменений
     - Assignee: назначьте ревьюера
   - Нажмите "Create merge request"

4. После принятия MR:
```bash
# Удаление локальной ветки
git branch -d feature/название-фичи

# Удаление ветки на сервере
git push origin --delete feature/название-фичи
```

### Процесс деплоя в продакшен

1. Создание MR из dev в prod:
   - Откройте GitLab в браузере
   - Перейдите в раздел "Merge Requests"
   - Нажмите "New merge request"
   - Выберите:
     - Source branch: dev
     - Target branch: prod
   - Заполните:
     - Title: Release vX.X.X
     - Description: список изменений
     - Assignee: назначьте мейнтейнера
   - Нажмите "Create merge request"

2. После принятия MR мейнтейнером:
```bash
# Переключение на ветку main
git checkout prod

# Получение последних изменений
git pull origin prod

# Создание тега для релиза
git tag -a vX.X.X -m "Release vX.X.X"
git push origin vX.X.X
```

### Правила оформления коммитов

- Используйте префиксы для коммитов:
  - `feat:` - новая функциональность
  - `fix:` - исправление бага
  - `docs:` - изменения в документации
  - `style:` - форматирование, отступы и т.д.
  - `refactor:` - рефакторинг кода
  - `test:` - добавление или изменение тестов
  - `chore:` - обновление зависимостей, настройка CI/CD и т.д.

Пример:
```bash
git commit -m "feat: добавление авторизации через JWT"
```