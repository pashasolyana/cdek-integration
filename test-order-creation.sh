#!/bin/bash

# Тестовый скрипт для проверки создания заказа CDEK
# Использование: ./test-order-creation.sh

API_URL="http://localhost:3000"

echo "🧪 Тест создания заказа CDEK"
echo "=============================="
echo ""

# 1. Проверка статуса сервиса
echo "1️⃣ Проверка статуса CDEK API..."
curl -s "${API_URL}/cdek/status" | jq '.'
echo ""

# 2. Расчёт тарифа
echo "2️⃣ Расчёт тарифа..."
TARIFF_RESPONSE=$(curl -s -X POST "${API_URL}/cdek/calculator/tarifflist" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-22T12:00:00+07:00",
    "type": 1,
    "from_location": {
      "code": 270,
      "postal_code": "630000"
    },
    "to_location": {
      "code": 44,
      "postal_code": "101000"
    },
    "packages": [
      {
        "weight": 1000,
        "length": 30,
        "width": 20,
        "height": 10
      }
    ]
  }')

echo "$TARIFF_RESPONSE" | jq '.'
echo ""

# Извлекаем первый тариф
TARIFF_CODE=$(echo "$TARIFF_RESPONSE" | jq -r '.data.tariff_codes[0].tariff_code')

if [ "$TARIFF_CODE" = "null" ] || [ -z "$TARIFF_CODE" ]; then
  echo "❌ Не удалось получить тариф. Проверьте расчёт."
  exit 1
fi

echo "✅ Выбран тариф: $TARIFF_CODE"
echo ""

# 3. Создание заказа
echo "3️⃣ Создание заказа с тарифом $TARIFF_CODE..."
ORDER_RESPONSE=$(curl -s -X POST "${API_URL}/cdek/orders" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": 1,
    \"number\": \"TEST-ORDER-$(date +%s)\",
    \"tariff_code\": $TARIFF_CODE,
    \"comment\": \"Тестовый заказ из скрипта\",
    \"recipient\": {
      \"name\": \"Иванов Иван Иванович\",
      \"phones\": [
        {
          \"number\": \"+79991234567\"
        }
      ]
    },
    \"sender\": {
      \"name\": \"ООО Тестовая компания\",
      \"phones\": [
        {
          \"number\": \"+79991234568\"
        }
      ]
    },
    \"from_location\": {
      \"code\": 270,
      \"country_code\": \"RU\",
      \"city\": \"Новосибирск\",
      \"postal_code\": \"630000\"
    },
    \"to_location\": {
      \"code\": 44,
      \"country_code\": \"RU\",
      \"city\": \"Москва\",
      \"postal_code\": \"101000\"
    },
    \"packages\": [
      {
        \"number\": \"1\",
        \"weight\": 1000,
        \"length\": 30,
        \"width\": 20,
        \"height\": 10,
        \"comment\": \"-\",
        \"items\": [
          {
            \"name\": \"Тестовый товар\",
            \"ware_key\": \"TEST-ITEM-001\",
            \"payment\": {
              \"value\": 5000
            },
            \"cost\": 5000,
            \"weight\": 1000,
            \"amount\": 1
          }
        ]
      }
    ]
  }")

echo "$ORDER_RESPONSE" | jq '.'
echo ""

# Проверка результата
SUCCESS=$(echo "$ORDER_RESPONSE" | jq -r '.success')
UUID=$(echo "$ORDER_RESPONSE" | jq -r '.data.entity.uuid // empty')
CDEK_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.data.local.cdekNumber // empty')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Заказ успешно создан!"
  [ -n "$UUID" ] && echo "   UUID: $UUID"
  [ -n "$CDEK_NUMBER" ] && echo "   CDEK номер: $CDEK_NUMBER"
else
  echo "❌ Ошибка при создании заказа"
  echo "$ORDER_RESPONSE" | jq '.error'
  exit 1
fi

echo ""
echo "🎉 Тест завершён успешно!"
