FROM python:3.10-slim

# Установка зависимостей системы
RUN apt-get update && apt-get install -y build-essential libpq-dev curl && apt-get clean

WORKDIR /app

# Копируем зависимости
COPY requirements.txt .

# Установка Python-зависимостей
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Копируем проект и скрипт запуска
COPY . .
RUN chmod +x ./start.sh

EXPOSE 8000

CMD ["./start.sh"]
