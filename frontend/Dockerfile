# Этап сборки
FROM registry.hub.docker.com/library/node:16-alpine as build

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --omit=dev

# Копируем исходный код
COPY src ./src
COPY public ./public

# Собираем приложение
RUN npm run build

# Этап продакшена (минимальный)
FROM registry.hub.docker.com/library/nginx:1.20-alpine

# Копируем собранное приложение
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx (оптимизированно)
CMD ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
