#!/bin/bash

# Скрипт для обновления приложения с минимальным downtime

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Обновление приложения ===${NC}"

# Бэкап базы данных
echo -e "${YELLOW}Создание резервной копии базы данных...${NC}"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER:-cdek_user} ${POSTGRES_DB:-cdek_db} > $BACKUP_DIR/db_backup.sql
echo -e "${GREEN}✓ Резервная копия создана: $BACKUP_DIR/db_backup.sql${NC}"

# Получение последних изменений
echo -e "${YELLOW}Получение изменений из репозитория...${NC}"
git pull origin main

# Сборка новых образов
echo -e "${YELLOW}Сборка обновленных образов...${NC}"
docker-compose build

# Применение миграций базы данных
echo -e "${YELLOW}Применение миграций базы данных...${NC}"
docker-compose run --rm backend npx prisma migrate deploy

# Перезапуск backend с новой версией
echo -e "${YELLOW}Обновление backend...${NC}"
docker-compose up -d --no-deps --build backend

sleep 5

# Проверка backend
if docker-compose exec -T backend curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend успешно обновлен${NC}"
else
    echo -e "${RED}✗ Ошибка обновления backend, откат...${NC}"
    docker-compose up -d --no-deps --force-recreate backend
    exit 1
fi

# Перезапуск frontend
echo -e "${YELLOW}Обновление frontend...${NC}"
docker-compose up -d --no-deps --build frontend

sleep 3

if docker-compose exec -T frontend wget --no-verbose --tries=1 --spider http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend успешно обновлен${NC}"
else
    echo -e "${RED}✗ Ошибка обновления frontend${NC}"
fi

# Перезапуск nginx (если изменилась конфигурация)
echo -e "${YELLOW}Перезагрузка nginx...${NC}"
docker-compose restart nginx

# Очистка старых образов
echo -e "${YELLOW}Очистка неиспользуемых образов...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}=== Обновление завершено! ===${NC}"
echo ""
echo -e "${GREEN}Статус сервисов:${NC}"
docker-compose ps
echo ""
echo -e "${BLUE}Резервная копия сохранена в: $BACKUP_DIR${NC}"
echo ""
