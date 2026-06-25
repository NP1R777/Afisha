FROM python:3.10-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем ВЕСЬ проект
COPY . .

# Запуск (самое важное)
CMD ["sh", "-c", "cd /app && PYTHONPATH=/app alembic upgrade head && PYTHONPATH=/app/app uvicorn app.main:app --host 0.0.0.0 --port 8000"]