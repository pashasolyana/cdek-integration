# BEGUNOK.PRO Frontend

Vue 3 приложение с TypeScript для курьерского сервиса с безопасной авторизацией.

## Особенности

- ✅ Vue 3 с Composition API и TypeScript
- ✅ Pinia для управления состоянием
- ✅ Vue Router с защищенными маршрутами
- ✅ Безопасная авторизация через HttpOnly cookies
- ✅ Responsive дизайн согласно макету
- ✅ Axios для HTTP запросов
- ✅ ESLint + Prettier для качества кода

## Технологии

- **Vue 3** - основной фреймворк
- **TypeScript** - типизация
- **Pinia** - управление состоянием
- **Vue Router** - маршрутизация
- **Axios** - HTTP клиент
- **Vite** - сборщик и dev сервер

## Установка и запуск

### Предварительные требования
- Node.js 16+ и npm
- Запущенный backend на порту 3000

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```
Приложение будет доступно по адресу: http://localhost:5173

### Сборка для production
```bash
npm run build
```

### Предварительный просмотр production сборки
```bash
npm run preview
```

## Структура проекта

```
src/
├── components/          # Компоненты
├── views/              # Страницы
│   ├── LoginView.vue   # Авторизация/регистрация
│   └── HomeView.vue    # Главная страница
├── stores/             # Pinia stores
│   └── auth.ts         # Авторизация
├── services/           # API сервисы
│   └── api.ts          # HTTP клиент
├── router/             # Маршрутизация
│   └── index.ts        # Настройки роутера
├── App.vue             # Корневой компонент
└── main.ts             # Точка входа
```

## API Endpoints

Приложение ожидает следующие endpoints на backend:

- `POST /api/auth/login` - вход в систему
- `POST /api/auth/register` - регистрация
- `POST /api/auth/logout` - выход
- `GET /api/auth/me` - проверка авторизации

## Безопасность

- HttpOnly cookies для JWT токенов
- Автоматическая проверка авторизации
- Защищенные маршруты
- CORS поддержка
- Обработка ошибок авторизации

Подробнее в [SECURITY.md](./SECURITY.md)

## Разработка

### Проверка типов
```bash
npm run type-check
```

### Линтинг
```bash
npm run lint
```

### Форматирование кода
```bash
npm run format
```

## Переменные окружения

Создайте файл `.env.local` для локальных настроек:

```env
VITE_API_URL=http://localhost:3000/api
```

## Браузеры

- Chrome 87+
- Firefox 78+
- Safari 13+
- Edge 88+
