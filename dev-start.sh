#!/bin/bash

# Скрипт для локальной разработки без SSL

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Запуск в режиме разработки ===${NC}"

# Проверка .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}Создание .env из .env.example...${NC}"
    cp .env.example .env
    echo "Отредактируйте .env файл перед запуском"
    exit 1
fi

# Создание директорий
mkdir -p nginx/conf.d

# Использование HTTP конфигурации
echo -e "${GREEN}Настройка конфигурации для разработки...${NC}"
cp nginx/default-http.conf.template nginx/conf.d/default.conf.template

# Запуск в dev режиме
echo -e "${GREEN}Запуск сервисов...${NC}"
docker-compose up -d postgres redis

# Ожидание БД
echo -e "${YELLOW}Ожидание запуска PostgreSQL...${NC}"
sleep 5

# Применение миграций
echo -e "${GREEN}Применение миграций...${NC}"
docker-compose run --rm backend npx prisma migrate deploy

# Запуск остальных сервисов
echo -e "${GREEN}Запуск приложения...${NC}"
docker-compose up -d backend frontend nginx

sleep 5

echo ""
echo -e "${GREEN}=== Разработка готова! ===${NC}"
echo ""
echo "Приложение доступно на:"
echo "  http://localhost - Frontend"
echo "  http://localhost/api - Backend API"
echo ""
echo "Для просмотра логов: docker-compose logs -f"
echo "Для остановки: docker-compose down"
echo ""
