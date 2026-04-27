#!/bin/bash
set -e

echo "📦 Применяем миграции Alembic..."
alembic upgrade head

echo "🚀 Запускаем приложение..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
