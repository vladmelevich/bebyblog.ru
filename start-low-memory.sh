#!/bin/bash

echo "🔧 Запуск проекта с низким потреблением памяти..."

# Останавливаем все контейнеры
echo "⏹️ Останавливаем контейнеры..."
docker-compose down

# Очищаем Docker кэш
echo "🧹 Очищаем Docker кэш..."
docker system prune -f

# Запускаем с ограниченной памятью
echo "🚀 Запускаем с ограниченной памятью..."
docker-compose -f docker-compose.low-memory.yml up -d

echo "✅ Проект запущен с низким потреблением памяти!"
echo "🌍 Доступен по адресу: http://localhost"
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.low-memory.yml ps

echo ""
echo "💡 Если frontend все еще падает, попробуйте:"
echo "   docker-compose -f docker-compose.low-memory.yml logs frontend"
