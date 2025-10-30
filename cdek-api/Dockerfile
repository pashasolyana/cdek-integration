# Используем официальный Node.js образ
FROM node:20-alpine AS base

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем все зависимости (включая dev dependencies для сборки)
RUN npm ci && npm cache clean --force

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Production стадия
FROM node:20-alpine AS production

WORKDIR /app

# Устанавливаем curl для healthcheck
RUN apk add --no-cache curl

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Копируем необходимые файлы из предыдущей стадии
COPY --from=base --chown=nestjs:nodejs /app/dist ./dist
COPY --from=base --chown=nestjs:nodejs /app/prisma ./prisma
COPY --chown=nestjs:nodejs package*.json ./
COPY --chown=nestjs:nodejs start.sh ./

# Устанавливаем только production зависимости + prisma для миграций
RUN npm ci --only=production && npm install prisma && npm cache clean --force

# Генерируем Prisma Client для production окружения
RUN npx prisma generate

# Делаем скрипт запуска исполняемым и устанавливаем права
RUN chmod +x start.sh && chown nestjs:nodejs start.sh

# Переключаемся на непривилегированного пользователя
USER nestjs

# Открываем порт
EXPOSE 3000

# Добавляем healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Запускаем приложение
CMD ["./start.sh"]