#!/bin/sh

echo "🚀 Запуск Alembic миграций..."
alembic upgrade head

echo "🌐 Запуск FastAPI приложения..."
uvicorn app.main:app --host 0.0.0.0 --port 8000