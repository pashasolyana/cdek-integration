# BEGUNOK.PRO - Полная система авторизации

Полнофункциональная система авторизации с максимальной безопасностью для курьерского сервиса.

## 🔐 Реализованные меры безопасности

### ✅ JWT токены с коротким временем жизни (15 минут)
- Access токены живут всего 15 минут
- Автоматическое обновление через refresh токены
- Refresh токены хранятся в БД и могут быть отозваны

### ✅ Refresh токены для обновления access токенов
- Долгоживущие (7 дней) refresh токены
- Безопасное хранение в базе данных
- Возможность отзыва всех токенов пользователя

### ✅ Secure и SameSite флаги для cookies в HTTPS
```typescript
response.cookie('access_token', accessToken, {
  httpOnly: true,
  secure: isProduction, // HTTPS в production
  sameSite: isProduction ? 'strict' : 'lax',
  maxAge: 15 * 60 * 1000, // 15 минут
  path: '/',
});
```

### ✅ CORS настройки для production домена
- Настроенные origins для development и production
- Credentials: true для работы с cookies
- Контроль методов и заголовков

### ✅ Rate limiting для предотвращения brute force атак
- 5 попыток входа в 15 минут
- 3 попытки регистрации в 5 минут
- Общий rate limiting на уровне приложения

### ✅ Валидация и санитизация входящих данных
```typescript
@IsNotEmpty({ message: 'Номер телефона обязателен' })
@Matches(/^\+?[1-9]\d{1,14}$/, {
  message: 'Некорректный формат номера телефона'
})
phone: string;

@MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
  message: 'Пароль должен содержать буквы и цифры'
})
password: string;
```

### ✅ HTTPS обязательно в production
- Helmet для security headers
- CSP (Content Security Policy) настройки
- HSTS в production режиме

## 🚀 Запуск системы

### 1. Backend (NestJS + PostgreSQL)
```bash
# В папке cdek-api
cd /home/pashasolyana/cdek/cdek-api

# Запуск базы данных
docker compose up -d

# Установка зависимостей (уже выполнено)
npm install

# Запуск в режиме разработки
npm run start:dev
```

**Backend будет доступен на**: http://localhost:3001
- API: http://localhost:3001/api/*
- Swagger: http://localhost:3001/api-docs
- Auth endpoints: http://localhost:3001/api/auth/*

### 2. Frontend (Vue 3 + TypeScript)
```bash
# В папке frontend
cd /home/pashasolyana/cdek/frontend

# Установка зависимостей (уже выполнено)
npm install

# Запуск в режиме разработки
npm run dev
```

**Frontend будет доступен на**: http://localhost:5173

## 🔌 API Endpoints

### Авторизация (публичные)
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `POST /api/auth/refresh` - обновление токенов

### Авторизация (защищенные)
- `GET /api/auth/me` - информация о текущем пользователе
- `POST /api/auth/logout` - выход
- `POST /api/auth/logout-all` - выход со всех устройств
- `GET /api/auth/validate` - проверка токена

## 💾 Структура базы данных

```sql
-- Пользователи
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Refresh токены
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_revoked BOOLEAN DEFAULT FALSE
);
```

## 🧪 Тестирование

### Регистрация нового пользователя
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79001234567",
    "password": "Test123456"
  }' \
  -c cookies.txt
```

### Вход в систему
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79001234567", 
    "password": "Test123456"
  }' \
  -c cookies.txt
```

### Проверка авторизации
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -b cookies.txt
```

## 🔧 Переменные окружения

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://cdek_user:cdek_password@localhost:5432/cdek_db
JWT_SECRET=dev_jwt_secret_key_change_in_production_123456789
JWT_EXPIRES_IN=900s
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (vite.config.ts)
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## 📋 Функциональность

### Фронтенд
- ✅ Страница авторизации согласно макету
- ✅ Переключение между входом и регистрацией
- ✅ Валидация форм в реальном времени
- ✅ Автоматическое обновление токенов
- ✅ Защищенные маршруты
- ✅ Обработка ошибок авторизации

### Бэкенд
- ✅ Безопасная регистрация с хешированием паролей (bcrypt, 12 rounds)
- ✅ JWT токены с коротким временем жизни
- ✅ Refresh токены с возможностью отзыва
- ✅ HttpOnly cookies для максимальной безопасности
- ✅ Rate limiting против brute force атак
- ✅ Валидация и санитизация данных
- ✅ Security headers (Helmet)
- ✅ CORS защита

## 🏗️ Архитектура

```
Frontend (Vue 3 + TypeScript)
↕️ HTTP Requests with Credentials
Backend (NestJS + Express)
├── 🔐 JWT Auth Guard (Global)
├── 🚦 Rate Limiting (Global)  
├── 🛡️ Helmet Security Headers
├── 📝 Request Validation
└── 💾 PostgreSQL Database
    ├── users
    └── refresh_tokens
```

## 🚧 Production Ready

Система готова к production развертыванию с минимальными изменениями:

1. **Замените JWT_SECRET** на криптографически стойкий ключ
2. **Настройте HTTPS** и обновите CORS origins
3. **Добавьте мониторинг** и логирование
4. **Настройте CI/CD** pipeline
5. **Добавьте backup** для базы данных

## 📞 Поддержка

При возникновении вопросов или проблем:
1. Проверьте логи backend: `docker logs cdek-api`
2. Убедитесь, что база данных запущена: `docker ps`
3. Проверьте доступность API: http://localhost:3001/api/health