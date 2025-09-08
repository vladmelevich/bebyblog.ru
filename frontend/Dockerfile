# Этап сборки (оптимизированный)
FROM node:18-alpine as build

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости (оптимизированно)
RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund

# Копируем исходный код
COPY src ./src
COPY public ./public

# Собираем приложение с оптимизацией
RUN npm run build

# Этап продакшена (минимальный)
FROM nginx:alpine

# Копируем собранное приложение
COPY --from=build /app/build /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx (оптимизированно)
CMD ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
