# CDEK API Integration

RESTful API для интеграции с службой доставки CDEK, построенный на NestJS с использованием TypeScript, PostgreSQL и Docker.

## 🚀 Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd cdek-api
```

### 2. Настройка переменных окружения

Скопируйте файл `.env.example` в `.env` и настройте переменные:

```bash
cp .env.example .env
```

Основные переменные для настройки:

```env
# Настройки CDEK API
CDEK_API_URL=https://api.cdek.ru  # Для тестирования
CDEK_CLIENT_ID=your_cdek_client_id
CDEK_CLIENT_SECRET=your_cdek_client_secret

# Настройки безопасности
JWT_SECRET=your_very_secure_jwt_secret_key_here
POSTGRES_PASSWORD=your_secure_password_here
```

### 3. Запуск с Docker

```bash
# Запуск всех сервисов
docker compose up -d --build

# Или только определенные сервисы
docker compose up -d postgres redis app
```

### 4. Проверка работоспособности

```bash
# Проверка статуса API
curl http://localhost:3000/api/health

# Swagger документация
# Откройте в браузере: http://localhost:3000/api-docs
```

## 📡 API Endpoints

### Основные эндпоинты

- `GET /api/health` - Проверка состояния сервиса
- `POST /api/cdek/auth/token` - Проверка токена авторизации CDEK
- `GET /api/cdek/orders` - Получение информации о заказе по номеру
- `GET /api/cdek/orders/:id` - Получение информации о заказе по UUID
- `POST /api/cdek/orders` - Создание нового заказа
- `GET /api/cdek/delivery-points` - Список пунктов выдачи
- `POST /api/cdek/calculate` - Расчет стоимости доставки
- `GET /api/cdek/status` - Статус подключения к CDEK API

### Документация API

Полная интерактивная документация Swagger доступна по адресу:
`http://localhost:3000/api-docs`

## 🛠 Разработка

### Локальный запуск для разработки

```bash
# Установка зависимостей
npm install

# Запуск базы данных
docker compose up -d postgres redis

# Применение миграций
npx prisma migrate dev

# Запуск в режиме разработки
npm run start:dev
```

### Структура проекта

```
src/
├── app.module.ts          # Основной модуль приложения
├── main.ts               # Точка входа приложения
├── cdek/                 # Модуль CDEK API
│   ├── cdek.controller.ts # Контроллер API endpoints
│   ├── cdek.service.ts   # Бизнес-логика интеграции
│   ├── cdek.module.ts    # Модуль CDEK
│   └── dto/              # Data Transfer Objects
├── health/               # Модуль проверки здоровья
├── prisma/              # Сервис базы данных
└── prisma/              # Схемы и миграции БД
```

### Полезные команды

```bash
# Сборка проекта
npm run build

# Запуск тестов
npm run test

# Форматирование кода
npm run format

# Линтинг
npm run lint

# Генерация Prisma клиента
npx prisma generate

# Просмотр базы данных
npx prisma studio
```

## 🐳 Docker Services

### Сервисы в docker-compose

- **app** (порт 3000) - Основное NestJS приложение
- **postgres** (порт 5432) - База данных PostgreSQL
- **redis** (порт 6379) - Кеш и сессии
- **adminer** (порт 8080) - Веб-интерфейс для управления БД

### Управление контейнерами

```bash
# Запуск всех сервисов
docker compose up -d

# Остановка всех сервисов
docker compose down

# Просмотр логов
docker compose logs -f app

# Перезапуск конкретного сервиса
docker compose restart app

# Пересборка и запуск
docker compose up -d --build
```

## 🔧 Настройка переменных окружения

### Полный список переменных `.env`

```env
# Приложение
NODE_ENV=production
PORT=3000

# База данных
POSTGRES_DB=cdek_db
POSTGRES_USER=cdek_user
POSTGRES_PASSWORD=secure_password
POSTGRES_PORT=5432
DATABASE_URL=postgresql://user:password@postgres:5432/cdek_db?schema=public

# Redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# CDEK API
CDEK_API_URL=https://api.cdek.ru
CDEK_CLIENT_ID=your_client_id
CDEK_CLIENT_SECRET=your_client_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=3600s

# Дополнительные настройки
ADMINER_PORT=8080
LOG_LEVEL=info
LOG_FORMAT=json
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🔒 Безопасность

1. **Обязательно смените** `JWT_SECRET` и `POSTGRES_PASSWORD` в production
2. Используйте сильные пароли для всех сервисов
3. Настройте правильные CORS origins для production
4. Не коммитьте `.env` файл в git

## 📊 База данных

### Prisma схема

Приложение использует Prisma ORM для работы с PostgreSQL. Основные модели:

- `CdekToken` - Токены авторизации CDEK
- `ApiLog` - Логи API запросов
- `CdekOrder` - Кеш заказов CDEK
- `DeliveryPoint` - Кеш пунктов выдачи

### Миграции

```bash
# Создание новой миграции
npx prisma migrate dev --name migration_name

# Применение миграций в production
npx prisma migrate deploy

# Сброс базы данных (только для разработки!)
npx prisma migrate reset
```

## 🚨 Troubleshooting

### Частые проблемы

1. **Контейнеры не запускаются**
   ```bash
   docker compose down
   docker system prune -f
   docker compose up -d --build
   ```

2. **База данных недоступна**
   ```bash
   docker compose restart postgres
   docker compose logs postgres
   ```

3. **Ошибки Prisma**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

4. **Проблемы с правами доступа**
   ```bash
   sudo chown -R $USER:$USER .
   ```

## 📝 Логирование

Логи доступны через Docker:

```bash
# Все логи приложения
docker compose logs -f app

# Логи всех сервисов
docker compose logs -f

# Логи конкретного сервиса
docker compose logs -f postgres
```

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## ✨ Фичи

- ✅ Автоматическое управление токенами CDEK
- ✅ Retry механизм при 401 ошибках
- ✅ Полное логирование API запросов
- ✅ Swagger документация
- ✅ Docker контейнеризация
- ✅ Автоматические миграции БД
- ✅ Health check эндпоинты
- ✅ Кеширование в Redis
- ✅ TypeScript строгая типизация
- ✅ Валидация входных данных
- ✅ Graceful shutdown