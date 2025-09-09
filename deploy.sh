#!/bin/bash

# Скрипт деплоя для kwork_site
echo "🚀 Начинаем деплой kwork_site на сервер 93.183.80.220"

# Останавливаем существующие контейнеры
echo "📦 Останавливаем существующие контейнеры..."
docker-compose down

# Удаляем старые образы (опционально)
echo "🗑️ Удаляем старые образы..."
docker system prune -f

# Собираем новые образы
echo "🔨 Собираем новые образы..."
docker-compose build --no-cache

# Запускаем контейнеры
echo "▶️ Запускаем контейнеры..."
docker-compose up -d

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Выполняем миграции
echo "🗄️ Выполняем миграции базы данных..."
docker-compose exec backend python manage.py migrate

# Создаем суперпользователя (если нужно)
echo "👤 Создаем суперпользователя..."
docker-compose exec backend python manage.py createsuperuser --noinput --username admin --email admin@example.com || echo "Суперпользователь уже существует"

# Собираем статические файлы
echo "📁 Собираем статические файлы..."
docker-compose exec backend python manage.py collectstatic --noinput

# Проверяем статус контейнеров
echo "✅ Проверяем статус контейнеров..."
docker-compose ps

echo "🎉 Деплой завершен! Сайт доступен по адресу: http://93.183.80.220"
echo "📊 Для просмотра логов используйте: docker-compose logs -f"
echo "🛑 Для остановки используйте: docker-compose down"
