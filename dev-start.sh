#!/bin/bash

echo "⚡ Супер быстрый запуск для разработки..."

# Останавливаем все
docker-compose down

# Запускаем все сразу, но без ожидания
echo "🚀 Запускаем все сервисы параллельно..."
docker-compose up -d

echo "✅ Запуск завершен!"
echo "🌍 Сайт: http://localhost"
echo "🔧 API: http://localhost/api/"
echo "📊 Статус:"
docker-compose ps

echo ""
echo "📝 Полезные команды:"
echo "  docker-compose logs -f backend  # Логи backend"
echo "  docker-compose logs -f nginx    # Логи nginx"
echo "  docker-compose restart backend  # Перезапуск backend"
