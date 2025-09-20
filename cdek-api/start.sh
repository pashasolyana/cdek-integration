#!/bin/sh

echo "🚀 Запуск CDEK API..."

echo "📋 Выполняем миграции базы данных..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Миграции выполнены успешно"
else
    echo "❌ Ошибка при выполнении миграций"
    exit 1
fi

echo "🎯 Запускаем приложение..."
node dist/main.js