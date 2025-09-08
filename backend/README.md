# Chat Backend API

Асинхронный бэкенд для чата с WebSocket поддержкой.

## Установка и запуск

### 1. Установка зависимостей

```bash
cd backend
pip install -r requirements.txt
```

### 2. Настройка базы данных

Создайте PostgreSQL базу данных:

```sql
CREATE DATABASE chat_db;
CREATE USER chat_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;
```

### 3. Настройка переменных окружения

Скопируйте `env_example` в `.env` и настройте:

```bash
cp env_example .env
```

Отредактируйте `.env`:
```
DATABASE_URL=postgresql://chat_user:your_password@localhost/chat_db
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 4. Запуск сервера

```bash
python main.py
```

Сервер будет доступен по адресу: `http://localhost:8000`

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/users/me` - Текущий пользователь

### Пользователи
- `GET /api/users` - Список пользователей

### Чаты
- `GET /api/chats` - Список чатов
- `POST /api/chats` - Создание чата

### Сообщения
- `GET /api/chats/{chat_id}/messages` - Сообщения чата
- `POST /api/chats/{chat_id}/messages` - Отправка сообщения
- `PUT /api/messages/{message_id}` - Редактирование сообщения
- `DELETE /api/messages/{message_id}` - Удаление сообщения
- `POST /api/messages/{message_id}/files` - Загрузка файла

### WebSocket
- `WS /ws/{user_id}` - WebSocket соединение для чата

## WebSocket Events

### От клиента:
- `join_chat` - Присоединение к чату
- `leave_chat` - Покидание чата
- `typing` - Индикатор набора текста

### От сервера:
- `new_message` - Новое сообщение
- `message_updated` - Сообщение обновлено
- `message_deleted` - Сообщение удалено
- `typing` - Кто-то печатает

## Структура проекта

```
backend/
├── main.py              # Основной файл приложения
├── database.py          # Настройки базы данных
├── models.py            # SQLAlchemy модели
├── schemas.py           # Pydantic схемы
├── auth.py              # Аутентификация и JWT
├── websocket_manager.py # Менеджер WebSocket соединений
├── requirements.txt     # Зависимости Python
├── env_example          # Пример переменных окружения
└── media/               # Директория для файлов
    ├── avatars/         # Аватары пользователей
    └── messages/        # Файлы сообщений
```

## Особенности

- **Асинхронность**: Использует FastAPI и async/await
- **WebSocket**: Реальное время для чата
- **JWT аутентификация**: Безопасная авторизация
- **Загрузка файлов**: Поддержка изображений и документов
- **PostgreSQL**: Надежная база данных
- **CORS**: Настроен для фронтенда на localhost:3000



