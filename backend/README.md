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
- `GET /parser/events` — просмотр собранных событий из staging-таблицы.

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