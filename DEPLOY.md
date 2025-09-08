# 🚀 Деплой kwork_site на сервер

## 📋 Требования

- Docker и Docker Compose
- Сервер с IP: 46.149.70.4
- Минимум 2GB RAM
- 10GB свободного места

## 🛠️ Установка

### 1. Подключение к серверу
```bash
ssh root@46.149.70.4
```

### 2. Установка Docker (если не установлен)
```bash
# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 3. Клонирование проекта
```bash
git clone <your-repo-url> kwork_site
cd kwork_site
```

### 4. Настройка переменных окружения
```bash
# Копируем файл с переменными окружения
cp env.production .env

# Редактируем настройки
nano .env
```

**Важно изменить:**
- `SECRET_KEY` - сгенерируйте новый секретный ключ
- `EMAIL_HOST_USER` - ваш email для отправки писем
- `EMAIL_HOST_PASSWORD` - пароль приложения для email

### 5. Запуск приложения
```bash
# Делаем скрипты исполняемыми
chmod +x deploy.sh manage.sh

# Запускаем деплой
./deploy.sh
```

## 🎛️ Управление

### Основные команды
```bash
# Запуск
./manage.sh start

# Остановка
./manage.sh stop

# Перезапуск
./manage.sh restart

# Просмотр логов
./manage.sh logs

# Статус контейнеров
./manage.sh status

# Миграции базы данных
./manage.sh migrate

# Сбор статических файлов
./manage.sh collectstatic

# Django shell
./manage.sh shell

# Бэкап базы данных
./manage.sh backup

# Обновление приложения
./manage.sh update
```

## 🌐 Доступ к сайту

После успешного деплоя сайт будет доступен по адресу:
- **HTTP**: http://46.149.70.4
- **API**: http://46.149.70.4/api/

## 📊 Мониторинг

### Просмотр логов
```bash
# Все логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Статус контейнеров
```bash
docker-compose ps
```

### Использование ресурсов
```bash
docker stats
```

## 🔧 Настройка SSL (опционально)

Для настройки HTTPS:

1. Получите SSL сертификат (Let's Encrypt)
2. Обновите nginx конфигурацию
3. Добавьте редирект с HTTP на HTTPS

## 🗄️ Бэкап и восстановление

### Создание бэкапа
```bash
./manage.sh backup
```

### Восстановление из бэкапа
```bash
# Останавливаем приложение
./manage.sh stop

# Восстанавливаем базу данных
docker-compose exec db psql -U kwork_user -d kwork_site < backup_file.sql

# Запускаем приложение
./manage.sh start
```

## 🚨 Устранение неполадок

### Проблемы с базой данных
```bash
# Проверяем подключение к БД
docker-compose exec backend python manage.py dbshell

# Сбрасываем миграции (ОСТОРОЖНО!)
docker-compose exec backend python manage.py migrate --fake-initial
```

### Проблемы с статическими файлами
```bash
# Пересобираем статические файлы
./manage.sh collectstatic
```

### Проблемы с контейнерами
```bash
# Пересобираем все контейнеры
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📈 Масштабирование

Для увеличения производительности:

1. Увеличьте количество workers в gunicorn
2. Настройте Redis для кэширования
3. Используйте CDN для статических файлов
4. Настройте мониторинг (Prometheus + Grafana)

## 🔐 Безопасность

1. Регулярно обновляйте зависимости
2. Используйте сильные пароли
3. Настройте файрвол
4. Включите логирование
5. Регулярно создавайте бэкапы

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `./manage.sh logs`
2. Проверьте статус: `./manage.sh status`
3. Перезапустите: `./manage.sh restart`
