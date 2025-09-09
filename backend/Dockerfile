FROM python:3.11-alpine

# Устанавливаем системные зависимости (оптимизированно)
RUN apk add --no-cache \
    gcc \
    musl-dev \
    mariadb-dev \
    pkgconfig

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем requirements.txt и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY . .

# Создаем пользователя для безопасности
RUN adduser --disabled-password --gecos '' appuser

# Создаем папки staticfiles, media и logs с правами
RUN mkdir -p /app/staticfiles /app/media/avatars /app/logs && \
    chown -R appuser:appuser /app

# Переключаемся на пользователя appuser
USER appuser

# Открываем порт
EXPOSE 8000

# Команда запуска (оптимизированная)
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "30", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "100", "core.wsgi:application"]
