# Печать накладных CDEK

## Описание

Метод для формирования и получения накладной к заказу в формате PDF. Метод автоматически:
1. Отправляет запрос на формирование накладной
2. Ожидает готовности накладной (polling статуса каждые 2 секунды, максимум 30 попыток = 60 секунд)
3. Возвращает готовую ссылку на скачивание PDF

Ссылка на скачивание действительна **1 час**.

## Backend API

### Эндпоинт
```
POST /cdek/orders/print-waybill
```

### Заголовки
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Тело запроса

```json
{
  "orders": [
    {
      "order_uuid": "72753031-3c87-4f7e-8fd9-c3d75c1d8b5f",
      "copy_count": 2
    },
    {
      "cdek_number": 1106394409,
      "copy_count": 2
    }
  ],
  "type": "tpl_russia"
}
```

#### Параметры:

- **orders** (обязательно) - массив заказов для печати (максимум 100)
  - **order_uuid** - UUID заказа в CDEK (обязателен, если не указан cdek_number)
  - **cdek_number** - номер заказа CDEK (обязателен, если не указан order_uuid)
  - **copy_count** - количество копий на листе (по умолчанию: 2)

- **type** (опционально) - форма квитанции, возможные значения:
  - `tpl_russia` (по умолчанию) - русский язык
  - `tpl_english` - английский язык
  - `tpl_china` - китайский язык
  - `tpl_armenia` - армянский язык
  - `tpl_italian` - итальянский язык
  - `tpl_korean` - корейский язык
  - `tpl_latvian` - латышский язык
  - `tpl_lithuanian` - литовский язык
  - `tpl_german` - немецкий язык
  - `tpl_turkish` - турецкий язык
  - `tpl_czech` - чешский язык
  - `tpl_thailand` - тайский язык
  - `tpl_invoice` - инвойс

### Ответ

#### Успешный ответ (200 OK):

```json
{
  "success": true,
  "entity": {
    "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
    "orders": [
      {
        "order_uuid": "72753031-3c87-4f7e-8fd9-c3d75c1d8b5f",
        "copy_count": 2
      }
    ],
    "copy_count": 2,
    "type": "tpl_russia",
    "url": "https://api.cdek.ru/v2/print/orders/095be615-a8ad-4c33-8e9c-c7612fbf6c9f.pdf",
    "statuses": [
      {
        "code": "READY",
        "name": "Сформирован",
        "date_time": "2024-10-22T12:00:00Z"
      }
    ]
  },
  "url": "https://api.cdek.ru/v2/print/orders/095be615-a8ad-4c33-8e9c-c7612fbf6c9f.pdf",
  "pdfBase64": "JVBERi0xLjQKJeLjz9MKMyAwIG9iago8PC9UeXBlL...", 
  "status": "READY",
  "message": "Накладная успешно сформирована"
}
```

**Поля ответа:**
- **url** - Ссылка на PDF (действительна 1 час)
- **pdfBase64** - PDF файл в формате Base64 (готов для немедленного использования)

#### Возможные коды статусов:

- **ACCEPTED** - Запрос принят
- **PROCESSING** - Накладная формируется
- **READY** - Накладная готова (ссылка доступна)
- **INVALID** - Некорректный запрос
- **REMOVED** - Истекло время жизни ссылки

#### Ошибки:

**400 Bad Request** - Неверные параметры
```json
{
  "success": false,
  "message": "Для каждого заказа необходимо указать order_uuid или cdek_number",
  "error": "..."
}
```

**408 Request Timeout** - Превышено время ожидания
```json
{
  "success": false,
  "message": "Превышено время ожидания формирования накладной",
  "error": "..."
}
```

## Frontend использование

### Импорт сервиса

```typescript
import { cdekService } from '@/services/cdek.service'
```

### Пример использования

```typescript
// Печать накладной по UUID заказа
const printByUuid = async () => {
  try {
    const result = await cdekService.printWaybill([
      { order_uuid: '72753031-3c87-4f7e-8fd9-c3d75c1d8b5f', copy_count: 2 }
    ])
    
    // Вариант 1: Открываем PDF из Base64 (рекомендуется)
    if (result.pdfBase64) {
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    }
    // Вариант 2: Открываем по ссылке (fallback)
    else if (result.url) {
      window.open(result.url, '_blank')
    }
    
    console.log('Статус:', result.status) // READY
  } catch (error) {
    console.error('Ошибка печати накладной:', error)
  }
}

// Печать накладной по номеру CDEK с автоматическим скачиванием
const printByCdekNumber = async () => {
  try {
    const result = await cdekService.printWaybill([
      { cdek_number: 1106394409, copy_count: 2 }
    ])
    
    // Скачивание файла из Base64
    if (result.pdfBase64) {
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `waybill_${Date.now()}.pdf`
      link.click()
      
      // Очищаем URL
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    }
  } catch (error) {
    console.error('Ошибка печати накладной:', error)
  }
}

// Печать нескольких накладных
const printMultiple = async (orderIds: string[]) => {
  try {
    const orders = orderIds.map(uuid => ({ 
      order_uuid: uuid, 
      copy_count: 2 
    }))
    
    const result = await cdekService.printWaybill(orders, 'tpl_russia')
    
    // Открываем в новом окне
    window.open(result.url, '_blank')
  } catch (error) {
    console.error('Ошибка печати накладных:', error)
  }
}
```

### Vue компонент пример

```vue
<template>
  <div>
    <button 
      @click="printWaybill" 
      :disabled="loading"
      class="print-btn"
    >
      {{ loading ? 'Формирование...' : 'Печать накладной' }}
    </button>
    
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { cdekService } from '@/services/cdek.service'

const props = defineProps<{
  orderUuid?: string
  cdekNumber?: number
}>()

const loading = ref(false)
const error = ref<string | null>(null)

const printWaybill = async () => {
  loading.value = true
  error.value = null
  
  try {
    const orders = props.orderUuid 
      ? [{ order_uuid: props.orderUuid, copy_count: 2 }]
      : [{ cdek_number: props.cdekNumber, copy_count: 2 }]
    
    const result = await cdekService.printWaybill(orders)
    
    // Открываем PDF из Base64
    if (result.pdfBase64) {
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    }
  } catch (err: any) {
    error.value = err.message || 'Не удалось сформировать накладную'
  } finally {
    loading.value = false
  }
}
</script>
```

## Особенности реализации

1. **Автоматический polling**: Метод автоматически ожидает готовности накладной, проверяя статус каждые 2 секунды
2. **Timeout**: Максимальное время ожидания - 60 секунд (30 попыток × 2 секунды)
3. **Один запрос с фронтенда**: Не нужно делать отдельные запросы для формирования и получения статуса
4. **Валидация**: Проверка на максимум 100 заказов и наличие идентификатора
5. **PDF в двух форматах**:
   - **pdfBase64** - Готовый файл в Base64 (рекомендуется использовать)
   - **url** - Ссылка на скачивание (действительна 1 час, fallback)
6. **Автоматическое скачивание PDF**: Backend автоматически скачивает PDF и отправляет на фронтенд
7. **Нет дополнительных запросов**: Клиент получает готовый файл, не нужно делать отдельный запрос по ссылке

## Интеграция в таблицу заказов

Пример добавления кнопки печати в таблицу заказов:

```vue
<Table :columns="columns" :rows="orders">
  <template #actions="{ row }">
    <button @click="printWaybill(row.uuid)" class="action-btn">
      📄 Печать
    </button>
  </template>
</Table>
```

## Логирование

Все запросы логируются в `cdek.service.ts`:
- Формирование накладной
- Каждая проверка статуса (polling)
- Финальный результат или ошибка
