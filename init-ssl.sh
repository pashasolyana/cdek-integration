#!/bin/bash

# Скрипт для первоначального получения SSL сертификата от Let's Encrypt

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Инициализация SSL сертификата ===${NC}"

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo -e "${RED}Ошибка: Файл .env не найден!${NC}"
    echo "Создайте .env файл на основе .env.example"
    exit 1
fi

# Загрузка переменных окружения
source .env

# Проверка обязательных переменных
if [ -z "$DOMAIN_NAME" ]; then
    echo -e "${RED}Ошибка: DOMAIN_NAME не установлен в .env${NC}"
    exit 1
fi

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Ошибка: EMAIL не установлен в .env${NC}"
    exit 1
fi

echo -e "${YELLOW}Домен: $DOMAIN_NAME${NC}"
echo -e "${YELLOW}Email: $EMAIL${NC}"

# Создание необходимых директорий
echo -e "${GREEN}Создание директорий для certbot...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p nginx/conf.d

# Создание временной nginx конфигурации (только HTTP)
echo -e "${GREEN}Создание временной конфигурации nginx (HTTP only)...${NC}"
cp nginx/default-http.conf.template nginx/conf.d/default.conf.template

# Запуск контейнеров без SSL
echo -e "${GREEN}Запуск контейнеров (HTTP режим)...${NC}"
docker-compose -f docker-compose.yml up -d postgres redis backend frontend nginx

# Ожидание запуска сервисов
echo -e "${YELLOW}Ожидание запуска сервисов...${NC}"
sleep 10

# Проверка доступности сервера
echo -e "${GREEN}Проверка доступности HTTP сервера...${NC}"
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTP сервер доступен${NC}"
else
    echo -e "${RED}✗ HTTP сервер недоступен${NC}"
    echo "Проверьте логи: docker-compose logs nginx"
    exit 1
fi

# Получение SSL сертификата
echo -e "${GREEN}Получение SSL сертификата от Let's Encrypt...${NC}"

# Проверка staging режима
STAGING_ARG=""
if [ "$CERTBOT_STAGING" = "true" ]; then
    echo -e "${YELLOW}⚠ Использование staging сервера Let's Encrypt (для тестирования)${NC}"
    STAGING_ARG="--staging"
fi

docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    -d $DOMAIN_NAME \
    -d www.$DOMAIN_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL сертификат успешно получен!${NC}"
else
    echo -e "${RED}✗ Ошибка получения SSL сертификата${NC}"
    exit 1
fi

# Переключение на полную конфигурацию с HTTPS
echo -e "${GREEN}Обновление конфигурации nginx (включение HTTPS)...${NC}"
cp nginx/default.conf.template nginx/conf.d/default.conf.template

# Перезапуск nginx с новой конфигурацией
echo -e "${GREEN}Перезапуск nginx...${NC}"
docker-compose restart nginx

# Ожидание перезапуска
sleep 5

# Проверка HTTPS
echo -e "${GREEN}Проверка HTTPS...${NC}"
if curl -k -f https://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTPS работает!${NC}"
else
    echo -e "${YELLOW}⚠ HTTPS может быть недоступен локально (это нормально для production домена)${NC}"
fi

echo ""
echo -e "${GREEN}=== Настройка завершена! ===${NC}"
echo ""
echo -e "${GREEN}Ваше приложение доступно по адресу:${NC}"
echo -e "  HTTP:  http://$DOMAIN_NAME"
echo -e "  HTTPS: https://$DOMAIN_NAME"
echo ""
echo -e "${YELLOW}Важно:${NC}"
echo "  1. Убедитесь, что DNS записи для $DOMAIN_NAME указывают на IP вашего сервера"
echo "  2. Порты 80 и 443 должны быть открыты в firewall"
echo "  3. Сертификат будет автоматически обновляться каждые 12 часов"
echo ""
echo -e "${GREEN}Полезные команды:${NC}"
echo "  docker-compose logs -f        # Просмотр логов всех сервисов"
echo "  docker-compose ps             # Статус контейнеров"
echo "  docker-compose down           # Остановка всех сервисов"
echo ""
