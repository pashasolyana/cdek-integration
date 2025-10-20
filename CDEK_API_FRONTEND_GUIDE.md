# 📦 Руководство по интеграции с CDEK API для фронтенда

## 📑 Содержание

1. [Расчёт стоимости и сроков доставки](#1-расчёт-стоимости-и-сроков-доставки)
2. [Создание заказа](#2-создание-заказа)
3. [Получение информации о заказе](#3-получение-информации-о-заказе)
4. [Справочники и локации](#4-справочники-и-локации)
5. [Пункты выдачи заказов (ПВЗ)](#5-пункты-выдачи-заказов-пвз)
6. [Типовые сценарии использования](#6-типовые-сценарии-использования)

---

## 1. Расчёт стоимости и сроков доставки

### 🎯 Endpoint
```
POST /cdek/calculator/tarifflist
```

### 📝 Описание
Рассчитывает стоимость и сроки доставки по всем доступным тарифам CDEK. Используется для отображения вариантов доставки пользователю перед созданием заказа.

### 🔐 Авторизация
Требуется Bearer Token (JWT)

### 📥 Структура запроса

#### Минимальный запрос (для стандартной доставки):

```json
{
  "date": "2025-10-20T14:15:22+0300",
  "type": 1,
  "from_location": {
    "city": "Москва",
    "postal_code": "101000"
  },
  "to_location": {
    "city": "Санкт-Петербург",
    "postal_code": "190000"
  },
  "packages": [
    {
      "weight": 1500,
      "length": 20,
      "width": 15,
      "height": 10
    }
  ]
}
```

#### Полный запрос (со всеми опциями):

```json
{
  "date": "2025-10-20T14:15:22+0300",
  "type": 1,
  "currency": 643,
  "lang": "rus",
  "additional_order_types": [2, 4],
  "from_location": {
    "code": 44,
    "country_code": "RU",
    "city": "Москва",
    "postal_code": "101000",
    "address": "ул. Тверская, д. 1",
    "contragent_type": "LEGAL_ENTITY"
  },
  "to_location": {
    "code": 137,
    "country_code": "RU",
    "city": "Санкт-Петербург",
    "postal_code": "190000",
    "address": "Невский пр., д. 1",
    "contragent_type": "INDIVIDUAL"
  },
  "packages": [
    {
      "weight": 1500,
      "length": 20,
      "width": 15,
      "height": 10
    },
    {
      "weight": 2000,
      "length": 25,
      "width": 20,
      "height": 15
    }
  ]
}
```

### 📋 Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `date` | string | ✅ | Дата/время планируемой передачи заказа в формате ISO 8601 |
| `type` | number | ⚠️ | Тип заказа: `1` — интернет-магазин (по умолчанию), `2` — доставка |
| `currency` | number | ❌ | Код валюты по ISO 4217 (643 — рубль) |
| `lang` | string | ❌ | Язык ответа: `rus`, `eng`, `zho` (по умолчанию `rus`) |
| `additional_order_types` | number[] | ❌ | Дополнительные типы заказа |
| `from_location` | object | ✅ | Адрес отправления |
| `to_location` | object | ✅ | Адрес получения |
| `packages` | array | ✅ | Список посылок (минимум 1) |

#### Структура `from_location` / `to_location`:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `code` | number | ⚠️ | Код города CDEK (рекомендуется) |
| `postal_code` | string | ⚠️ | Почтовый индекс (если нет `code`) |
| `city` | string | ⚠️ | Название города (если нет `code`) |
| `country_code` | string | ❌ | Код страны ISO-2 (например, `RU`) |
| `address` | string | ❌ | Полный адрес (для доставки до двери) |
| `contragent_type` | string | ❌ | `INDIVIDUAL` или `LEGAL_ENTITY` |
| `latitude` | number | ❌ | Широта |
| `longitude` | number | ❌ | Долгота |

> **💡 Рекомендация:** Используйте `code` (код города CDEK) для точности. Получить его можно через `/cdek/location/suggest/cities`.

#### Структура `packages`:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `weight` | number | ✅ | Вес в граммах (например, `1500` = 1.5 кг) |
| `length` | number | ✅ | Длина в сантиметрах |
| `width` | number | ✅ | Ширина в сантиметрах |
| `height` | number | ✅ | Высота в сантиметрах |

### 📤 Структура ответа

```json
{
  "success": true,
  "data": {
    "tariff_codes": [
      {
        "tariff_code": 136,
        "tariff_name": "Посылка склад-склад",
        "tariff_description": "Доставка от и до склада CDEK",
        "delivery_mode": 1,
        "delivery_sum": 350.50,
        "period_min": 2,
        "period_max": 3,
        "calendar_min": 2,
        "calendar_max": 4,
        "delivery_date_range": {
          "min": "2025-10-22",
          "max": "2025-10-24"
        }
      },
      {
        "tariff_code": 137,
        "tariff_name": "Посылка склад-дверь",
        "tariff_description": "Доставка от склада до двери",
        "delivery_mode": 2,
        "delivery_sum": 450.75,
        "period_min": 2,
        "period_max": 4,
        "calendar_min": 3,
        "calendar_max": 5,
        "delivery_date_range": {
          "min": "2025-10-23",
          "max": "2025-10-25"
        }
      }
    ]
  },
  "message": "Расчёт выполнен"
}
```

#### Поля ответа:

| Поле | Тип | Описание |
|------|-----|----------|
| `tariff_code` | number | Код тарифа (используется при создании заказа) |
| `tariff_name` | string | Название тарифа |
| `tariff_description` | string | Описание тарифа |
| `delivery_mode` | number | Режим доставки |
| `delivery_sum` | number | Стоимость доставки в рублях |
| `period_min` | number | Минимальный срок доставки (рабочие дни) |
| `period_max` | number | Максимальный срок доставки (рабочие дни) |
| `calendar_min` | number | Минимальный срок доставки (календарные дни) |
| `calendar_max` | number | Максимальный срок доставки (календарные дни) |
| `delivery_date_range` | object | Диапазон дат доставки |

### ⚠️ Возможные ошибки

```json
{
  "success": false,
  "data": {
    "tariff_codes": [],
    "errors": [
      {
        "code": "v2_invalid_location",
        "message": "Населённый пункт не найден"
      }
    ],
    "warnings": [
      {
        "code": "weight_exceeded",
        "message": "Превышен максимальный вес для тарифа"
      }
    ]
  }
}
```

---

## 2. Создание заказа

### 🎯 Endpoint
```
POST /cdek/orders
```

### 📝 Описание
Регистрирует новый заказ в системе CDEK и сохраняет его в локальной базе данных.

### 🔐 Авторизация
Требуется Bearer Token (JWT)

### 📥 Структура запроса

#### Минимальный заказ (ПВЗ → ПВЗ):

```json
{
  "type": 1,
  "tariff_code": 136,
  "shipment_point": "MSK123",
  "delivery_point": "SPB456",
  "recipient": {
    "name": "Иванов Иван Иванович",
    "phones": [
      {
        "number": "+79991234567"
      }
    ]
  },
  "packages": [
    {
      "number": "1",
      "weight": 1500,
      "length": 20,
      "width": 15,
      "height": 10,
      "comment": "Хрупкое",
      "items": [
        {
          "name": "Кружка керамическая",
          "ware_key": "PROD-001",
          "payment": {
            "value": 1000
          },
          "cost": 1000,
          "weight": 500,
          "amount": 1
        }
      ]
    }
  ]
}
```

#### Заказ с доставкой до двери:

```json
{
  "type": 1,
  "number": "ORDER-2025-12345",
  "tariff_code": 137,
  "comment": "Позвонить за час до доставки",
  "shipment_point": "MSK123",
  "recipient": {
    "name": "Петров Пётр Петрович",
    "company": "ООО Ромашка",
    "email": "petrov@example.com",
    "phones": [
      {
        "number": "+79991234567",
        "additional": "123"
      }
    ]
  },
  "to_location": {
    "city": "Санкт-Петербург",
    "address": "Невский проспект, д. 1, кв. 10",
    "postal_code": "190000"
  },
  "packages": [
    {
      "number": "1",
      "weight": 2000,
      "length": 30,
      "width": 20,
      "height": 15,
      "items": [
        {
          "name": "Ноутбук ASUS",
          "ware_key": "LAPTOP-001",
          "payment": {
            "value": 50000,
            "vat_sum": 8333,
            "vat_rate": 20
          },
          "cost": 50000,
          "weight": 2000,
          "amount": 1,
          "brand": "ASUS",
          "country_code": "CN"
        }
      ]
    }
  ],
  "services": [
    {
      "code": "INSURANCE",
      "parameter": "50000"
    },
    {
      "code": "CALL"
    }
  ]
}
```

#### Полный заказ с доставкой (дверь → дверь):

```json
{
  "type": 2,
  "number": "ORD-2025-99999",
  "tariff_code": 139,
  "comment": "Осторожно, хрупкое!",
  "sender": {
    "name": "Отправитель Иван Иванович",
    "company": "ИП Иванов",
    "phones": [
      {
        "number": "+79991111111"
      }
    ],
    "email": "sender@example.com"
  },
  "recipient": {
    "name": "Получатель Пётр Петрович",
    "phones": [
      {
        "number": "+79992222222"
      }
    ],
    "email": "recipient@example.com",
    "contragent_type": "INDIVIDUAL"
  },
  "from_location": {
    "code": 44,
    "address": "ул. Тверская, д. 10, оф. 5",
    "postal_code": "101000"
  },
  "to_location": {
    "code": 137,
    "address": "Невский пр., д. 20, кв. 15",
    "postal_code": "190000"
  },
  "packages": [
    {
      "number": "PKG-001",
      "weight": 3000,
      "length": 40,
      "width": 30,
      "height": 20,
      "comment": "Хрупкая посуда",
      "items": [
        {
          "name": "Набор посуды фарфоровый",
          "ware_key": "DISHES-SET-01",
          "payment": {
            "value": 15000,
            "vat_sum": 2500,
            "vat_rate": 20
          },
          "cost": 15000,
          "weight": 3000,
          "amount": 1,
          "brand": "Imperial Porcelain",
          "country_code": "RU"
        }
      ]
    }
  ],
  "services": [
    {
      "code": "INSURANCE",
      "parameter": "15000"
    },
    {
      "code": "PACKAGE_1"
    }
  ]
}
```

### 📋 Параметры запроса

#### Основные параметры заказа:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `type` | number | ✅ | `1` — интернет-магазин, `2` — доставка |
| `tariff_code` | number | ✅ | Код тарифа (из расчёта `/calculator/tarifflist`) |
| `number` | string | ⚠️ | Номер заказа в вашей системе (обязателен для `type=1`) |
| `comment` | string | ❌ | Комментарий к заказу |
| `shipment_point` | string | ⚠️ | Код ПВЗ отправки (для склад→*) |
| `delivery_point` | string | ⚠️ | Код ПВЗ доставки (для *→склад) |
| `recipient` | object | ✅ | Данные получателя |
| `sender` | object | ⚠️ | Данные отправителя (обязательно для `type=2`) |
| `from_location` | object | ⚠️ | Адрес отправки (для дверь→*, конфликтует с `shipment_point`) |
| `to_location` | object | ⚠️ | Адрес доставки (для *→дверь, конфликтует с `delivery_point`) |
| `packages` | array | ✅ | Список посылок (минимум 1, максимум 255) |
| `services` | array | ❌ | Дополнительные услуги |

> **⚠️ ВАЖНО:** 
> - Для отправки **от склада**: используйте `shipment_point`
> - Для отправки **от двери**: используйте `from_location`
> - Для доставки **на склад/постамат**: используйте `delivery_point`
> - Для доставки **до двери**: используйте `to_location`

#### Структура `recipient` / `sender`:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `name` | string | ✅ | ФИО контакта |
| `phones` | array | ✅ | Телефоны (минимум 1) |
| `company` | string | ❌ | Название компании |
| `email` | string | ❌ | Email |
| `contragent_type` | string | ❌ | `INDIVIDUAL` или `LEGAL_ENTITY` |
| `passport_series` | string | ❌ | Серия паспорта (для международных) |
| `passport_number` | string | ❌ | Номер паспорта |
| `passport_date_of_issue` | string | ❌ | Дата выдачи паспорта |
| `passport_organization` | string | ❌ | Кем выдан паспорт |
| `tin` | string | ❌ | ИНН |
| `passport_date_of_birth` | string | ❌ | Дата рождения |

#### Структура `phones`:

```json
[
  {
    "number": "+79991234567",
    "additional": "123"
  }
]
```

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `number` | string | ✅ | Номер телефона (максимум 32 символа) |
| `additional` | string | ❌ | Добавочный номер (максимум 16 символов) |

#### Структура `from_location` / `to_location`:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `code` | number | ⚠️ | Код города CDEK |
| `city` | string | ⚠️ | Название города |
| `address` | string | ✅ | Полный адрес доставки |
| `postal_code` | string | ❌ | Почтовый индекс |
| `country_code` | string | ❌ | Код страны ISO-2 |
| `latitude` | number | ❌ | Широта |
| `longitude` | number | ❌ | Долгота |

#### Структура `packages`:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `number` | string | ❌ | Номер упаковки |
| `weight` | number | ✅ | Общий вес в граммах |
| `length` | number | ✅ | Длина в см |
| `width` | number | ✅ | Ширина в см |
| `height` | number | ✅ | Высота в см |
| `comment` | string | ❌ | Комментарий к упаковке |
| `items` | array | ✅ | Товары в упаковке |

> **⚠️ ВАЖНО:** Поле `comment` в `packages` **обязательно должно быть непустым** (минимум 1 символ), иначе CDEK API вернёт ошибку.

#### Структура `items` (товары):

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `name` | string | ✅ | Название товара (максимум 256 символов) |
| `ware_key` | string | ⚠️ | Артикул/код товара (рекомендуется) |
| `payment` | object | ✅ | Оплата за товар |
| `cost` | number | ✅ | Объявленная стоимость (для страховки) |
| `weight` | number | ✅ | Вес товара в граммах |
| `amount` | number | ✅ | Количество единиц |
| `brand` | string | ❌ | Бренд товара |
| `country_code` | string | ❌ | Код страны производства |
| `marking` | string | ❌ | Маркировка товара (для маркированных товаров) |
| `url` | string | ❌ | Ссылка на товар в интернет-магазине |

#### Структура `payment`:

```json
{
  "value": 10000,
  "vat_sum": 1667,
  "vat_rate": 20
}
```

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `value` | number | ✅ | Сумма в копейках (10000 = 100 руб) |
| `vat_sum` | number | ❌ | Сумма НДС в копейках |
| `vat_rate` | number | ❌ | Ставка НДС (0, 10, 20) |

#### Структура `services` (дополнительные услуги):

```json
[
  {
    "code": "INSURANCE",
    "parameter": "50000"
  },
  {
    "code": "CALL"
  }
]
```

**Популярные услуги:**

| Код | Параметр | Описание |
|-----|----------|----------|
| `INSURANCE` | Сумма страховки | Страхование груза |
| `CALL` | - | Прозвон получателя |
| `PACKAGE_1` | - | Упаковка 1 (пакет) |
| `PACKAGE_2` | - | Упаковка 2 (коробка) |
| `TRYING_ON` | - | Примерка для одежды |
| `PART_DELIV` | - | Частичная доставка |
| `PHOTO_DOCS` | - | Фотографирование документов |

### 📤 Структура ответа

#### Успешный ответ:

```json
{
  "success": true,
  "data": {
    "entity": {
      "uuid": "72753031-8b87-4020-a2fe-7f5a58bdb96e"
    },
    "requests": [
      {
        "request_uuid": "f93e4990-f66c-4d09-9ccb-aa0e94ae13dc",
        "type": "CREATE",
        "state": "ACCEPTED",
        "date_time": "2025-10-20T14:30:00+03:00"
      }
    ],
    "local": {
      "orderId": 123,
      "uuid": "72753031-8b87-4020-a2fe-7f5a58bdb96e",
      "cdekNumber": null
    }
  },
  "message": "Заказ зарегистрирован, данные сохранены"
}
```

#### Ответ с ошибками:

```json
{
  "success": false,
  "data": {
    "entity": {
      "uuid": "72753031-8b87-4020-a2fe-7f5a58bdb96e"
    },
    "requests": [
      {
        "request_uuid": "f93e4990-f66c-4d09-9ccb-aa0e94ae13dc",
        "type": "CREATE",
        "state": "INVALID",
        "errors": [
          {
            "code": "v2_entity_invalid_recipient_phone",
            "message": "Некорректный номер телефона получателя"
          }
        ],
        "warnings": []
      }
    ]
  },
  "message": "Заказ не прошёл валидацию"
}
```

### ⚠️ Важные замечания

1. **Асинхронная обработка**: CDEK обрабатывает заказы асинхронно. После создания заказ может иметь состояние:
   - `ACCEPTED` — принят на обработку
   - `SUCCESSFUL` — успешно обработан (появится `cdek_number`)
   - `INVALID` — содержит ошибки

2. **Получение номера CDEK**: Номер заказа CDEK (`cdek_number`) появляется не сразу. Нужно периодически запрашивать статус заказа по `uuid`.

3. **Валидация комментариев**: Поле `comment` в `packages` должно быть либо `undefined`, либо непустой строкой.

4. **Конфликтующие параметры**:
   - Нельзя одновременно указывать `shipment_point` и `from_location`
   - Нельзя одновременно указывать `delivery_point` и `to_location`

---

## 3. Получение информации о заказе

### 🎯 Endpoint 1: По UUID
```
GET /cdek/orders/:orderId
```

### 🎯 Endpoint 2: По номеру CDEK
```
GET /cdek/orders?cdek_number=1234567890
```

### 📝 Описание
Получает детальную информацию о созданном заказе, включая его статус, трек-номер и детали доставки.

### 🔐 Авторизация
- Endpoint 1: Требуется Bearer Token
- Endpoint 2: Публичный (`@Public()`)

### 📥 Параметры запроса

#### Вариант 1: По UUID заказа (рекомендуется для внутреннего использования)

```
GET /cdek/orders/72753031-8b87-4020-a2fe-7f5a58bdb96e
```

#### Вариант 2: По номеру CDEK (для отслеживания)

```
GET /cdek/orders?cdek_number=1234567890
```

### 📤 Структура ответа

```json
{
  "success": true,
  "data": {
    "entity": {
      "uuid": "72753031-8b87-4020-a2fe-7f5a58bdb96e",
      "type": 1,
      "cdek_number": "1234567890",
      "number": "ORDER-2025-12345",
      "tariff_code": 136,
      "delivery_mode": "PVZ",
      "comment": "Позвонить за час",
      "shipment_point": "MSK123",
      "delivery_point": "SPB456",
      "recipient": {
        "name": "Иванов Иван Иванович",
        "phones": [
          {
            "number": "+79991234567"
          }
        ],
        "email": "ivanov@example.com"
      },
      "packages": [
        {
          "number": "1",
          "weight": 1500,
          "length": 20,
          "width": 15,
          "height": 10,
          "items": [
            {
              "name": "Кружка керамическая",
              "ware_key": "PROD-001",
              "amount": 1,
              "cost": 1000,
              "weight": 500
            }
          ]
        }
      ],
      "statuses": [
        {
          "code": "ACCEPTED",
          "name": "Принят",
          "date_time": "2025-10-20T14:30:00+03:00",
          "city": "Москва"
        },
        {
          "code": "READY_FOR_SHIPMENT_IN_SENDER_CITY",
          "name": "Готов к отправке в городе отправителя",
          "date_time": "2025-10-21T10:00:00+03:00",
          "city": "Москва"
        }
      ],
      "delivery_detail": {
        "date": "2025-10-24",
        "recipient_name": "Иванов Иван Иванович",
        "delivery_sum": 350.50,
        "total_sum": 350.50
      }
    },
    "requests": [
      {
        "request_uuid": "f93e4990-f66c-4d09-9ccb-aa0e94ae13dc",
        "type": "CREATE",
        "state": "SUCCESSFUL",
        "date_time": "2025-10-20T14:30:00+03:00"
      }
    ]
  },
  "message": "Информация о заказе получена успешно"
}
```

### 📊 Основные статусы заказа

| Код статуса | Название | Описание |
|-------------|----------|----------|
| `ACCEPTED` | Принят | Заказ принят в систему CDEK |
| `CREATED` | Создан | Заказ зарегистрирован |
| `READY_FOR_SHIPMENT_IN_SENDER_CITY` | Готов к отправке | Заказ на складе отправителя |
| `TAKEN_BY_TRANSPORTER_FROM_SENDER_CITY` | Принят перевозчиком | В пути от отправителя |
| `ARRIVED_AT_SENDER_CITY` | Прибыл на склад | На складе CDEK в городе отправителя |
| `RETURNED_TO_SENDER_CITY_WAREHOUSE` | Возвращён на склад | Возврат на склад |
| `TAKEN_BY_TRANSPORTER_FROM_SENDER_WAREHOUSE` | Передан перевозчику | Отправлен в город получателя |
| `SENT_TO_SENDER_CITY` | Отправлен | В пути |
| `ARRIVED_AT_DESTINATION_CITY` | Прибыл в город доставки | На складе в городе получателя |
| `ARRIVED_AT_DELIVERY_POINT` | Прибыл в пункт выдачи | Готов к выдаче |
| `DELIVERED` | Доставлен | Заказ получен |
| `NOT_DELIVERED` | Не доставлен | Неудачная попытка доставки |
| `CANCELED` | Отменён | Заказ отменён |

---

## 4. Справочники и локации

### 4.1. Поиск города по названию

#### 🎯 Endpoint
```
GET /cdek/location/suggest/cities
```

#### 📥 Параметры

```
GET /cdek/location/suggest/cities?name=Санкт&country_code=RU
```

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `name` | string | ✅ | Часть названия города (минимум 3 символа) |
| `country_code` | string | ❌ | Код страны ISO-2 (по умолчанию `RU`) |

#### 📤 Ответ

```json
{
  "success": true,
  "data": [
    {
      "code": 137,
      "city": "Санкт-Петербург",
      "city_uuid": "71ec3d4a-7c3f-4a3e-bc64-77e2b1d9c7c6",
      "country_code": "RU",
      "country": "Россия",
      "region": "Санкт-Петербург",
      "region_code": 78,
      "postal_codes": ["190000", "190001"]
    }
  ],
  "message": "Подбор выполнен",
  "count": 1
}
```

### 4.2. Список регионов

#### 🎯 Endpoint
```
GET /cdek/location/regions
```

#### 📥 Параметры

```
GET /cdek/location/regions?country_code=RU&size=100&page=0
```

### 4.3. Почтовые индексы города

#### 🎯 Endpoint
```
GET /cdek/location/postalcodes
```

#### 📥 Параметры

```
GET /cdek/location/postalcodes?city_code=44
```

### 4.4. Определение локации по координатам

#### 🎯 Endpoint
```
GET /cdek/location/geolocation
```

#### 📥 Параметры

```
GET /cdek/location/geolocation?latitude=55.7558&longitude=37.6173
```

### 4.5. Детальный список городов

#### 🎯 Endpoint
```
GET /cdek/location/cities
```

#### 📥 Параметры

```
GET /cdek/location/cities?country_codes=RU&region_code=78&size=1000
```

---

## 5. Пункты выдачи заказов (ПВЗ)

### 5.1. Синхронизация ПВЗ с CDEK

#### 🎯 Endpoint
```
GET /cdek/delivery-points/sync
```

#### 📝 Описание
Загружает все пункты выдачи из API CDEK и сохраняет их в локальную базу данных. Процесс может занимать несколько минут.

### 5.2. Получение ПВЗ из базы данных

#### 🎯 Endpoint
```
GET /cdek/delivery-points/db
```

#### 📥 Примеры запросов

##### Поиск по городу:
```
GET /cdek/delivery-points/db?city_code=44&type=PVZ&limit=50
```

##### Поиск в радиусе (с PostGIS):
```
GET /cdek/delivery-points/db?center_lat=55.7558&center_lon=37.6173&radius_km=5&limit=20
```

##### Текстовый поиск:
```
GET /cdek/delivery-points/db?q=Тверская&limit=10
```

##### Поиск в bbox (прямоугольная область):
```
GET /cdek/delivery-points/db?lat_min=55.7&lat_max=55.8&lon_min=37.6&lon_max=37.7&limit=100
```

#### 📋 Параметры запроса

| Параметр | Тип | Описание |
|----------|-----|----------|
| `type` | string | Тип ПВЗ: `PVZ`, `POSTAMAT` |
| `city_code` | number | Код города CDEK |
| `q` | string | Текстовый поиск по адресу |
| `center_lat` | number | Широта центра (для поиска в радиусе) |
| `center_lon` | number | Долгота центра (для поиска в радиусе) |
| `radius_km` | number | Радиус поиска в километрах |
| `lat_min` | number | Минимальная широта (для bbox) |
| `lat_max` | number | Максимальная широта (для bbox) |
| `lon_min` | number | Минимальная долгота (для bbox) |
| `lon_max` | number | Максимальная долгота (для bbox) |
| `limit` | number | Количество результатов (по умолчанию 100) |
| `offset` | number | Смещение для пагинации |

#### 📤 Структура ответа

```json
{
  "total": 150,
  "rows": [
    {
      "uuid": "abc123",
      "code": "MSK123",
      "type": "PVZ",
      "city": "Москва",
      "city_code": 44,
      "address": "ул. Тверская, д. 1",
      "address_full": "101000, Россия, Москва, ул. Тверская, д. 1",
      "latitude": 55.7558,
      "longitude": 37.6173,
      "phones": [
        {
          "number": "+74951234567"
        }
      ],
      "work_times": [
        {
          "day": 1,
          "time": "09:00-20:00"
        }
      ],
      "images": [
        {
          "url": "https://cdn.cdek.ru/images/pvz/MSK123_1.jpg"
        }
      ],
      "dimensions": [
        {
          "width": 60,
          "height": 40,
          "depth": 40
        }
      ],
      "weight_min": 0,
      "weight_max": 30000,
      "have_cashless": true,
      "have_cash": true,
      "is_handout": true,
      "is_reception": true,
      "is_dressing_room": false
    }
  ]
}
```

---

## 6. Типовые сценарии использования

### 📦 Сценарий 1: Расчёт стоимости доставки для корзины

**Задача:** Пользователь добавил товары в корзину и хочет узнать варианты доставки.

**Шаги:**

1. **Получить данные от пользователя:**
   - Город доставки (через автокомплит `/cdek/location/suggest/cities`)
   - Способ получения (ПВЗ или курьером до двери)

2. **Рассчитать габариты и вес:**
   ```javascript
   const packages = [
     {
       weight: cart.items.reduce((sum, item) => sum + item.weight * item.quantity, 0),
       length: 40, // Размеры вашей стандартной коробки
       width: 30,
       height: 20
     }
   ];
   ```

3. **Отправить запрос на расчёт:**
   ```javascript
   const response = await fetch('/cdek/calculator/tarifflist', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       date: new Date().toISOString(),
       type: 1,
       from_location: {
         code: 44, // Москва (ваш склад)
         postal_code: "101000"
       },
       to_location: {
         code: userCityCode,
         postal_code: userPostalCode
       },
       packages
     })
   });
   ```

4. **Отобразить варианты:**
   ```javascript
   const { data } = await response.json();
   
   data.tariff_codes.forEach(tariff => {
     console.log(`${tariff.tariff_name}`);
     console.log(`Стоимость: ${tariff.delivery_sum} ₽`);
     console.log(`Срок: ${tariff.period_min}-${tariff.period_max} дней`);
   });
   ```

---

### 🏪 Сценарий 2: Создание заказа с доставкой в ПВЗ

**Задача:** Оформить заказ с доставкой в пункт выдачи CDEK.

**Шаги:**

1. **Показать карту ПВЗ:**
   ```javascript
   // Получить ПВЗ в радиусе 5 км от адреса пользователя
   const pvzList = await fetch(
     `/cdek/delivery-points/db?center_lat=${lat}&center_lon=${lon}&radius_km=5&type=PVZ`
   );
   ```

2. **Пользователь выбирает ПВЗ** из списка на карте.

3. **Создать заказ:**
   ```javascript
   const order = {
     type: 1,
     number: `ORDER-${Date.now()}`,
     tariff_code: selectedTariff.tariff_code,
     shipment_point: "MSK123", // Код вашего склада
     delivery_point: selectedPVZ.code,
     recipient: {
       name: form.fullName,
       phones: [{ number: form.phone }],
       email: form.email
     },
     packages: [
       {
         number: "1",
         weight: totalWeight,
         length: 40,
         width: 30,
         height: 20,
         comment: "Заказ из интернет-магазина",
         items: cart.items.map(item => ({
           name: item.name,
           ware_key: item.sku,
           payment: { value: item.price * 100 },
           cost: item.price * 100,
           weight: item.weight,
           amount: item.quantity
         }))
       }
     ]
   };

   const response = await fetch('/cdek/orders', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(order)
   });
   ```

4. **Сохранить UUID заказа** для отслеживания:
   ```javascript
   const { data } = await response.json();
   const orderUuid = data.entity.uuid;
   ```

---

### 🚚 Сценарий 3: Курьерская доставка до двери

**Задача:** Доставить заказ курьером по указанному адресу.

**Шаги:**

1. **Валидировать адрес:**
   ```javascript
   // Опционально: проверить адрес через геокодер
   const location = await fetch(
     `/cdek/location/cities?city=${city}&postal_code=${postalCode}`
   );
   ```

2. **Создать заказ с адресом доставки:**
   ```javascript
   const order = {
     type: 1,
     number: `ORDER-${Date.now()}`,
     tariff_code: 137, // Склад-дверь
     shipment_point: "MSK123",
     to_location: {
       code: cityCode,
       city: "Санкт-Петербург",
       address: "Невский проспект, д. 1, кв. 10",
       postal_code: "190000"
     },
     recipient: {
       name: "Иванов Иван Иванович",
       phones: [{ number: "+79991234567" }]
     },
     packages: [/* ... */],
     services: [
       { code: "CALL" } // Прозвон получателя
     ]
   };
   ```

---

### 📊 Сценарий 4: Отслеживание статуса заказа

**Задача:** Показать пользователю актуальный статус его заказа.

**Шаги:**

1. **Запросить информацию о заказе:**
   ```javascript
   const response = await fetch(`/cdek/orders?cdek_number=${cdekNumber}`);
   const { data } = await response.json();
   ```

2. **Отобразить статусы:**
   ```javascript
   const statuses = data.entity.statuses;
   const currentStatus = statuses[statuses.length - 1];
   
   console.log(`Статус: ${currentStatus.name}`);
   console.log(`Дата: ${currentStatus.date_time}`);
   console.log(`Город: ${currentStatus.city}`);
   
   // История перемещений
   statuses.forEach(status => {
     console.log(`${status.date_time}: ${status.name} (${status.city})`);
   });
   ```

3. **Отобразить детали доставки (если заказ доставлен):**
   ```javascript
   if (data.entity.delivery_detail) {
     const detail = data.entity.delivery_detail;
     console.log(`Дата доставки: ${detail.date}`);
     console.log(`Получил: ${detail.recipient_name}`);
     console.log(`Стоимость: ${detail.total_sum} ₽`);
   }
   ```

---

### 🗺️ Сценарий 5: Интерактивная карта ПВЗ

**Задача:** Показать карту с ближайшими пунктами выдачи.

**Шаги:**

1. **Определить местоположение пользователя:**
   ```javascript
   navigator.geolocation.getCurrentPosition(async (position) => {
     const { latitude, longitude } = position.coords;
     
     // Получить ПВЗ в радиусе 10 км
     const response = await fetch(
       `/cdek/delivery-points/db?center_lat=${latitude}&center_lon=${longitude}&radius_km=10&type=PVZ&limit=50`
     );
     
     const { rows: pvzList } = await response.json();
     
     // Отобразить на карте
     pvzList.forEach(pvz => {
       addMarkerToMap({
         lat: pvz.latitude,
         lng: pvz.longitude,
         title: pvz.address,
         info: {
           code: pvz.code,
           workTimes: pvz.work_times,
           phones: pvz.phones
         }
       });
     });
   });
   ```

2. **Фильтрация по параметрам:**
   ```javascript
   // Только ПВЗ с примерочной
   const withDressingRoom = pvzList.filter(pvz => pvz.is_dressing_room);
   
   // Только с оплатой наличными
   const withCash = pvzList.filter(pvz => pvz.have_cash);
   
   // Подходящие по габаритам
   const suitableBySize = pvzList.filter(pvz => 
     pvz.dimensions.some(d => 
       d.width >= packageWidth && 
       d.height >= packageHeight && 
       d.depth >= packageDepth
     )
   );
   ```

---

## 🔑 Типы заказов и тарифы

### Типы заказов (`type`):

| Код | Название | Описание |
|-----|----------|----------|
| `1` | Интернет-магазин | Заказ от интернет-магазина (по умолчанию) |
| `2` | Доставка | Обычная доставка (требуется указать отправителя) |

### Популярные тарифы:

| Код | Название | Описание |
|-----|----------|----------|
| `136` | Посылка склад-склад | Самовывоз из ПВЗ |
| `137` | Посылка склад-дверь | Курьерская доставка от склада |
| `138` | Посылка дверь-склад | Забор от отправителя, выдача в ПВЗ |
| `139` | Посылка дверь-дверь | Курьерская доставка от и до двери |
| `234` | Экономичная посылка склад-склад | Более дешевая доставка, дольше срок |
| `368` | Посылка "Маркетплейс" склад-склад | Для маркетплейсов |

> **💡 Рекомендация:** Всегда используйте `/calculator/tarifflist` для получения актуального списка тарифов с ценами.

---

## ⚠️ Важные ограничения и рекомендации

### Ограничения API:

1. **Вес:** Максимальный вес одной посылки — 30 кг
2. **Размеры:** Максимальная сумма длины, ширины и высоты — 300 см
3. **Количество упаковок:** Максимум 255 упаковок в одном заказе
4. **Длина строк:**
   - Название товара: 256 символов
   - Комментарий: 1024 символа
   - ФИО: 256 символов
   - Адрес: 1024 символа

### Рекомендации:

1. **Используйте коды городов** вместо названий для точности
2. **Кэшируйте справочники** (города, ПВЗ) на клиенте
3. **Валидируйте данные** перед отправкой на сервер
4. **Обрабатывайте ошибки** и показывайте понятные сообщения пользователю
5. **Сохраняйте UUID заказов** для последующего отслеживания
6. **Используйте дополнительные услуги** (прозвон, страхование) для улучшения опыта пользователя

### Типичные ошибки:

| Код ошибки | Описание | Решение |
|------------|----------|---------|
| `v2_invalid_location` | Неверно указана локация | Используйте `code` города из справочника |
| `v2_entity_invalid_recipient_phone` | Некорректный телефон | Проверьте формат: `+79991234567` |
| `v2_weight_exceeded` | Превышен вес | Разбейте на несколько посылок |
| `v2_size_exceeded` | Превышены габариты | Уменьшите размеры или используйте другой тариф |
| `v2_invalid_tariff` | Недоступный тариф | Используйте тариф из `/calculator/tarifflist` |

---

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи API в разделе `CdekApiCall` в базе данных
2. Убедитесь, что токен авторизации действителен
3. Проверьте формат данных согласно этому руководству
4. Обратитесь к [официальной документации CDEK](https://api-docs.cdek.ru/)

---

**Версия документа:** 1.0  
**Дата обновления:** 2025-10-20  
**Автор:** GitHub Copilot
