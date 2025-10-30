#!/bin/bash

# Скрипт для запуска приложения в production режиме

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Запуск CDEK Integration в production режиме ===${NC}"

# Проверка .env
if [ ! -f .env ]; then
    echo -e "${RED}Ошибка: Файл .env не найден!${NC}"
    echo "Создайте .env на основе .env.example и заполните все необходимые переменные"
    exit 1
fi

# Загрузка переменных
source .env

# Проверка наличия сертификатов
if [ ! -d "certbot/conf/live/$DOMAIN_NAME" ]; then
    echo -e "${YELLOW}⚠ SSL сертификаты не найдены${NC}"
    echo "Запустите сначала: ./init-ssl.sh"
    read -p "Хотите запустить без SSL? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Запуск без SSL
    echo -e "${YELLOW}Запуск в HTTP режиме...${NC}"
    cp nginx/default-http.conf.template nginx/conf.d/default.conf.template
else
    echo -e "${GREEN}✓ SSL сертификаты найдены${NC}"
    cp nginx/default.conf.template nginx/conf.d/default.conf.template
fi

# Остановка старых контейнеров
echo -e "${YELLOW}Остановка старых контейнеров...${NC}"
docker-compose down

# Сборка образов
echo -e "${GREEN}Сборка образов...${NC}"
docker-compose build --no-cache

# Запуск сервисов
echo -e "${GREEN}Запуск сервисов...${NC}"
docker-compose up -d

# Ожидание запуска
echo -e "${YELLOW}Ожидание запуска сервисов...${NC}"
sleep 15

# Проверка статуса
echo -e "${GREEN}Проверка статуса сервисов...${NC}"
docker-compose ps

# Проверка здоровья
echo ""
echo -e "${GREEN}Проверка health endpoints...${NC}"

if docker-compose exec -T backend curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API: OK${NC}"
else
    echo -e "${RED}✗ Backend API: FAIL${NC}"
fi

if docker-compose exec -T frontend wget --no-verbose --tries=1 --spider http://localhost/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend: OK${NC}"
else
    echo -e "${RED}✗ Frontend: FAIL${NC}"
fi

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Nginx (HTTP): OK${NC}"
else
    echo -e "${RED}✗ Nginx: FAIL${NC}"
fi

echo ""
echo -e "${GREEN}=== Развертывание завершено! ===${NC}"
echo ""
echo -e "${GREEN}Приложение доступно:${NC}"
echo "  http://$DOMAIN_NAME"
if [ -d "certbot/conf/live/$DOMAIN_NAME" ]; then
    echo "  https://$DOMAIN_NAME"
fi
echo ""
echo -e "${GREEN}Полезные команды:${NC}"
echo "  docker-compose logs -f [service]  # Просмотр логов"
echo "  docker-compose restart [service]  # Перезапуск сервиса"
echo "  docker-compose down               # Остановка"
echo "  docker-compose up -d              # Повторный запуск"
echo ""
