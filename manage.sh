#!/bin/bash

# Скрипт управления kwork_site

case "$1" in
    start)
        echo "▶️ Запускаем kwork_site..."
        docker-compose up -d
        ;;
    stop)
        echo "⏹️ Останавливаем kwork_site..."
        docker-compose down
        ;;
    restart)
        echo "🔄 Перезапускаем kwork_site..."
        docker-compose down
        docker-compose up -d
        ;;
    logs)
        echo "📋 Показываем логи..."
        docker-compose logs -f
        ;;
    status)
        echo "📊 Статус контейнеров:"
        docker-compose ps
        ;;
    migrate)
        echo "🗄️ Выполняем миграции..."
        docker-compose exec backend python manage.py migrate
        ;;
    collectstatic)
        echo "📁 Собираем статические файлы..."
        docker-compose exec backend python manage.py collectstatic --noinput
        ;;
    shell)
        echo "🐚 Открываем Django shell..."
        docker-compose exec backend python manage.py shell
        ;;
    backup)
        echo "💾 Создаем бэкап базы данных..."
        docker-compose exec db pg_dump -U kwork_user kwork_site > backup_$(date +%Y%m%d_%H%M%S).sql
        echo "Бэкап сохранен в backup_$(date +%Y%m%d_%H%M%S).sql"
        ;;
    update)
        echo "🔄 Обновляем приложение..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        docker-compose exec backend python manage.py migrate
        docker-compose exec backend python manage.py collectstatic --noinput
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|logs|status|migrate|collectstatic|shell|backup|update}"
        echo ""
        echo "Команды:"
        echo "  start       - Запустить приложение"
        echo "  stop        - Остановить приложение"
        echo "  restart     - Перезапустить приложение"
        echo "  logs        - Показать логи"
        echo "  status      - Показать статус контейнеров"
        echo "  migrate     - Выполнить миграции"
        echo "  collectstatic - Собрать статические файлы"
        echo "  shell       - Открыть Django shell"
        echo "  backup      - Создать бэкап базы данных"
        echo "  update      - Обновить приложение"
        exit 1
        ;;
esac
