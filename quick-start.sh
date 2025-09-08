#!/bin/bash

echo "🚀 Быстрый запуск BabyBlog проекта..."

# Останавливаем все контейнеры
echo "⏹️ Останавливаем контейнеры..."
docker-compose down

# Очищаем неиспользуемые образы и контейнеры
echo "🧹 Очищаем Docker кэш..."
docker system prune -f

# Запускаем только необходимые сервисы
echo "▶️ Запускаем сервисы..."
docker-compose up -d db redis

# Ждем готовности базы данных
echo "⏳ Ждем готовности базы данных..."
sleep 10

# Запускаем backend
echo "🔧 Запускаем backend..."
docker-compose up -d backend

# Ждем готовности backend
echo "⏳ Ждем готовности backend..."
sleep 15

# Запускаем frontend
echo "🎨 Запускаем frontend..."
docker-compose up -d frontend

# Ждем готовности frontend
echo "⏳ Ждем готовности frontend..."
sleep 10

# Запускаем nginx
echo "🌐 Запускаем nginx..."
docker-compose up -d nginx

echo "✅ Проект запущен!"
echo "🌍 Доступен по адресу: http://localhost"
echo "📊 Статус контейнеров:"
docker-compose ps
