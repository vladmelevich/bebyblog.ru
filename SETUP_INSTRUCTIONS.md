# Инструкции по запуску чата

## 🚀 Полная настройка проекта

### 1. Бэкенд (Python FastAPI)

#### Установка зависимостей:
```bash
cd backend
pip install -r requirements.txt
```

#### Настройка базы данных PostgreSQL:
```sql
-- Создайте базу данных
CREATE DATABASE chat_db;

-- Создайте пользователя
CREATE USER chat_user WITH PASSWORD 'your_password';

-- Дайте права
GRANT ALL PRIVILEGES ON DATABASE chat_db TO chat_user;
```

#### Настройка переменных окружения:
```bash
cd backend
cp env_example .env
```

Отредактируйте `.env`:
```
DATABASE_URL=postgresql://chat_user:your_password@localhost/chat_db
SECRET_KEY=your-super-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Запуск бэкенда:
```bash
cd backend
python start.py
```

Или напрямую:
```bash
cd backend
python main.py
```

**Бэкенд будет доступен по адресу:** `http://localhost:8000`

### 2. Фронтенд (React)

#### Установка зависимостей:
```bash
npm install
```

#### Запуск фронтенда:
```bash
npm start
```

**Фронтенд будет доступен по адресу:** `http://localhost:3000`

### 3. Обновление компонентов

Замените старые компоненты на новые:

```bash
# Замените основные файлы
mv src/App.js src/AppOld.js
mv src/AppNew.js src/App.js

mv src/components/ChatPage/ChatPage.js src/components/ChatPage/ChatPageOld.js
mv src/components/ChatPage/ChatPageNew.js src/components/ChatPage/ChatPage.js

mv src/components/FriendsPage/FriendsPage.js src/components/FriendsPage/FriendsPageOld.js
mv src/components/FriendsPage/FriendsPageNew.js src/components/FriendsPage/FriendsPage.js

mv src/components/AuthPage/AuthPage.js src/components/AuthPage/AuthPageOld.js
mv src/components/AuthPage/AuthPageNew.js src/components/AuthPage/AuthPage.js
```

## 📋 Функциональность

### ✅ Что работает:

1. **Аутентификация:**
   - Регистрация пользователей
   - Вход в систему
   - JWT токены

2. **Чаты:**
   - Создание чатов между пользователями
   - Список активных чатов
   - Список всех пользователей

3. **Сообщения:**
   - Отправка текстовых сообщений
   - Редактирование сообщений
   - Удаление сообщений
   - Загрузка файлов (фото, документы)

4. **WebSocket:**
   - Реальное время для сообщений
   - Индикатор набора текста
   - Мгновенные обновления

5. **UI/UX:**
   - Адаптивный дизайн
   - Контекстное меню для сообщений
   - Модальные окна
   - Красивая цветовая схема

## 🔧 API Endpoints

### Аутентификация:
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/users/me` - Текущий пользователь

### Чаты:
- `GET /api/chats` - Список чатов
- `POST /api/chats` - Создание чата

### Сообщения:
- `GET /api/chats/{chat_id}/messages` - Сообщения чата
- `POST /api/chats/{chat_id}/messages` - Отправка сообщения
- `PUT /api/messages/{message_id}` - Редактирование
- `DELETE /api/messages/{message_id}` - Удаление
- `POST /api/messages/{message_id}/files` - Загрузка файла

### WebSocket:
- `WS /ws/{user_id}` - WebSocket соединение

## 🎨 Особенности дизайна

- **Цветовая схема:** "кофе с молоком" + фиолетовые акценты
- **Адаптивность:** Работает на всех устройствах
- **Telegram-like:** Интерфейс как в Telegram
- **Анимации:** Плавные переходы и эффекты

## 🐛 Возможные проблемы

1. **База данных не подключается:**
   - Проверьте настройки PostgreSQL
   - Убедитесь, что сервис запущен
   - Проверьте .env файл

2. **CORS ошибки:**
   - Убедитесь, что бэкенд запущен на порту 8000
   - Проверьте настройки CORS в main.py

3. **WebSocket не работает:**
   - Проверьте, что бэкенд поддерживает WebSocket
   - Убедитесь, что нет блокировки файрволом

## 📱 Тестирование

1. Зарегистрируйте двух пользователей
2. Войдите под одним из них
3. Найдите второго пользователя в списке
4. Начните чат
5. Отправьте сообщения
6. Попробуйте редактировать/удалять сообщения
7. Загрузите файлы

## 🔒 Безопасность

- JWT токены для аутентификации
- Хеширование паролей
- Валидация данных
- CORS настройки
- Проверка прав доступа

## 📈 Производительность

- Асинхронный бэкенд
- WebSocket для реального времени
- Оптимизированные запросы к БД
- Кэширование соединений







