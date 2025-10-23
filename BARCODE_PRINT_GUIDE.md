# Руководство по формированию ШК места к заказу CDEK

## Описание

Этот документ описывает работу системы формирования штрих-кода места (ШК места) к заказам CDEK. Функционал позволяет автоматически создавать и скачивать PDF-файлы со штрих-кодами мест для печати на принтере.

## Архитектура

### Backend (NestJS)

#### DTO (Data Transfer Objects)

**Файл:** `cdek-api/src/cdek/dto/print-barcode.dto.ts`

```typescript
// Форматы печати
enum BarcodeFormat {
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6',
  A7 = 'A7',
}

// Языки печатной формы
enum BarcodeLanguage {
  RUS = 'RUS', // Русский
  ENG = 'ENG', // Английский
}

// DTO для заказа
class PrintBarcodeOrderDto {
  order_uuid?: string    // UUID заказа (обязателен, если нет cdek_number)
  cdek_number?: number   // Номер заказа CDEK (обязателен, если нет order_uuid)
}

// DTO запроса на формирование ШК места
class PrintBarcodeRequestDto {
  orders: PrintBarcodeOrderDto[]  // Список заказов (максимум 100)
  copy_count?: number = 1         // Количество копий (по умолчанию 1)
  format?: BarcodeFormat = 'A4'   // Формат печати (по умолчанию A4)
  lang?: BarcodeLanguage = 'RUS'  // Язык (по умолчанию RUS)
}

// DTO ответа
class BarcodeDto {
  uuid: string                    // UUID ШК места
  orders: PrintBarcodeOrderDto[]  // Список заказов
  copy_count?: number             // Количество копий
  format?: string                 // Формат печати
  lang?: string                   // Язык
  url?: string                    // Ссылка на скачивание (1 час)
  statuses: PrintBarcodeStatusDto[] // Статусы формирования
  pdfBase64?: string              // PDF в Base64
  pdfBuffer?: Buffer              // PDF как Buffer
}
```

#### Сервис

**Файл:** `cdek-api/src/cdek/cdek.service.ts`

**Метод:** `printBarcode(dto: PrintBarcodeRequestDtoV2): Promise<BarcodeDto>`

**Алгоритм работы:**

1. **Валидация входных данных**
   - Максимум 100 заказов
   - У каждого заказа должен быть `order_uuid` или `cdek_number`

2. **Формирование ШК места** (POST `/v2/print/barcodes`)
   ```typescript
   const createResponse = await this.post('/v2/print/barcodes', {
     orders: dto.orders,
     copy_count: dto.copy_count || 1,
     format: dto.format || 'A4',
     lang: dto.lang || 'RUS',
   });
   ```

3. **Polling статуса** (максимум 30 попыток × 2 секунды = 60 секунд)
   - Опрашивает endpoint GET `/v2/print/barcodes/{uuid}`
   - Проверяет статус: `ACCEPTED`, `PROCESSING`, `READY`, `INVALID`, `REMOVED`

4. **Скачивание PDF при статусе READY**
   ```typescript
   const pdfUrl = `https://api.edu.cdek.ru/v2/print/barcodes/${barcodeUuid}.pdf`;
   const pdfResponse = await this.apiClient.get(pdfUrl, {
     responseType: 'arraybuffer',
     headers: { Authorization: `Bearer ${token}` }
   });
   const pdfBuffer = Buffer.from(pdfResponse.data);
   ```

5. **Возврат результата**
   - `pdfBuffer`: Buffer для внутреннего использования
   - `pdfBase64`: Base64 строка для передачи на фронтенд
   - `url`: Временная ссылка CDEK (действительна 1 час)

**Возможные статусы:**

| Код | Название | Комментарий |
|-----|----------|-------------|
| `ACCEPTED` | Принят | Запрос на формирование ШК места принят |
| `INVALID` | Некорректный запрос | Некорректный запрос |
| `PROCESSING` | Формируется | Файл с ШК места формируется |
| `READY` | Сформирован | Файл готов и доступен для скачивания |
| `REMOVED` | Удален | Истекло время жизни ссылки |

#### Контроллер

**Файл:** `cdek-api/src/cdek/cdek.controller.ts`

**Endpoint:** `POST /cdek/orders/print-barcode`

```typescript
@Post('orders/print-barcode')
async printBarcode(@Body() dto: PrintBarcodeRequestDto) {
  const result = await this.cdekService.printBarcode(dto);
  return {
    success: true,
    entity: {
      uuid: result.uuid,
      orders: result.orders,
      copy_count: result.copy_count,
      format: result.format,
      lang: result.lang,
      url: result.url,
      statuses: result.statuses,
    },
    url: result.url,
    pdfBase64: result.pdfBase64, // PDF для фронтенда
    status: result.statuses?.[result.statuses.length - 1]?.code,
    message: 'ШК места успешно сформирован',
  };
}
```

### Frontend (Vue 3)

#### Сервис

**Файл:** `frontend/src/services/cdek.service.ts`

**Метод:** `printBarcode()`

```typescript
async printBarcode(
  orders: Array<{ order_uuid?: string; cdek_number?: number }>,
  format: string = 'A4',
  lang: string = 'RUS',
  copy_count: number = 1
): Promise<{ url: string; pdfBase64?: string; entity: any; status: string }> {
  const { data } = await this.api.post('/cdek/orders/print-barcode', {
    orders,
    format,
    lang,
    copy_count
  });
  return {
    url: data.url,
    pdfBase64: data.pdfBase64,
    entity: data.entity,
    status: data.status
  };
}
```

#### Компонент

**Файл:** `frontend/src/views/OrdersView.vue`

**Функция:** `printBarcode(row: any)`

```typescript
const printBarcode = async (row: any) => {
  if (!row.uuid && !row.cdekNumber) {
    error.value = 'Не удается распечатать ШК места: отсутствует UUID или номер CDEK';
    return;
  }

  printingBarcodes.value.add(row.id);
  
  try {
    const orders = [];
    if (row.uuid) {
      orders.push({ order_uuid: row.uuid });
    } else if (row.cdekNumber) {
      orders.push({ cdek_number: row.cdekNumber });
    }

    const result = await cdekService.printBarcode(orders, 'A4', 'RUS', 1);

    // Конвертируем Base64 в Blob и открываем в новом окне
    if (result.pdfBase64) {
      const byteCharacters = atob(result.pdfBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } finally {
    printingBarcodes.value.delete(row.id);
  }
}
```

**UI элементы:**

```vue
<button 
  class="print-btn" 
  @click="printBarcode(row)"
  :disabled="isPrintingBarcode(row.id)"
  :title="isPrintingBarcode(row.id) ? 'Формирование ШК места...' : 'Печать ШК места'"
>
  <span v-if="isPrintingBarcode(row.id)" class="print-spinner">⟳</span>
  <span v-else>📦</span>
</button>
```

## Примеры использования

### Пример 1: Формирование ШК места по UUID заказа

**Request:**
```bash
curl -X POST http://localhost:3001/cdek/orders/print-barcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orders": [
      {
        "order_uuid": "72753031-3c87-4f7e-8fd9-c3d75c1d8b5f"
      }
    ],
    "format": "A4",
    "lang": "RUS",
    "copy_count": 1
  }'
```

**Response:**
```json
{
  "success": true,
  "entity": {
    "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "orders": [
      {
        "order_uuid": "72753031-3c87-4f7e-8fd9-c3d75c1d8b5f"
      }
    ],
    "copy_count": 1,
    "format": "A4",
    "lang": "RUS",
    "url": "https://api.cdek.ru/v2/print/barcodes/a1b2c3d4.pdf",
    "statuses": [
      {
        "code": "ACCEPTED",
        "name": "Принят",
        "date_time": "2024-10-22T10:00:00Z"
      },
      {
        "code": "READY",
        "name": "Сформирован",
        "date_time": "2024-10-22T10:00:05Z"
      }
    ]
  },
  "url": "https://api.cdek.ru/v2/print/barcodes/a1b2c3d4.pdf",
  "pdfBase64": "JVBERi0xLjQKJeLjz9MKMSAwIG9iag...",
  "status": "READY",
  "message": "ШК места успешно сформирован"
}
```

### Пример 2: Формирование ШК места по номеру CDEK

**Request:**
```bash
curl -X POST http://localhost:3001/cdek/orders/print-barcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orders": [
      {
        "cdek_number": 1106394409
      }
    ],
    "format": "A5",
    "lang": "ENG",
    "copy_count": 2
  }'
```

### Пример 3: Формирование ШК места для нескольких заказов

**Request:**
```bash
curl -X POST http://localhost:3001/cdek/orders/print-barcode \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "orders": [
      {
        "order_uuid": "72753031-3c87-4f7e-8fd9-c3d75c1d8b5f"
      },
      {
        "cdek_number": 1106394409
      },
      {
        "cdek_number": 1106394410
      }
    ],
    "format": "A4",
    "lang": "RUS",
    "copy_count": 1
  }'
```

### Пример 4: Использование во фронтенде (JavaScript)

```javascript
import { cdekService } from '@/services/cdek.service';

async function printOrderBarcode(orderUuid) {
  try {
    const result = await cdekService.printBarcode(
      [{ order_uuid: orderUuid }],
      'A4',      // формат
      'RUS',     // язык
      1          // количество копий
    );

    // Открываем PDF в новом окне
    if (result.pdfBase64) {
      const byteCharacters = atob(result.pdfBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Очищаем URL через 1 минуту
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  } catch (error) {
    console.error('Ошибка при печати ШК места:', error);
  }
}
```

## Обработка ошибок

### Типичные ошибки

1. **400 Bad Request** - Некорректные данные запроса
   ```json
   {
     "success": false,
     "message": "Для каждого заказа необходимо указать order_uuid или cdek_number",
     "error": "BAD_REQUEST"
   }
   ```

2. **408 Request Timeout** - Превышено время ожидания
   ```json
   {
     "success": false,
     "message": "Превышено время ожидания формирования ШК места",
     "error": "REQUEST_TIMEOUT"
   }
   ```

3. **410 Gone** - Истекло время жизни ссылки
   ```json
   {
     "success": false,
     "message": "Истекло время жизни ссылки на ШК места",
     "error": "GONE"
   }
   ```

4. **500 Internal Server Error** - Ошибка CDEK API
   ```json
   {
     "success": false,
     "message": "Не удалось сформировать ШК места: Connection timeout",
     "error": "INTERNAL_SERVER_ERROR"
   }
   ```

## Производительность

### Характеристики

- **Время формирования:** 2-10 секунд в зависимости от загрузки CDEK API
- **Максимальное время ожидания:** 60 секунд (30 попыток × 2 секунды)
- **Размер PDF файла:** 10-50 KB на заказ
- **Лимит заказов:** 100 заказов в одном запросе

### Рекомендации по оптимизации

1. **Группировка заказов:** Формируйте ШК места для нескольких заказов одним запросом
2. **Кэширование PDF:** На фронтенде сохраняйте Base64 в локальном хранилище для повторного использования
3. **Отложенная загрузка:** Формируйте ШК места асинхронно, не блокируя UI
4. **Индикаторы прогресса:** Показывайте пользователю статус формирования

## Безопасность

### Защита данных

1. **Авторизация:** Все запросы требуют Bearer token
2. **Валидация:** Проверка входных данных на backend
3. **Rate limiting:** Ограничение количества запросов (см. throttle.config.ts)
4. **Временные ссылки:** URL от CDEK действителен только 1 час

### Best Practices

1. Не сохраняйте Bearer token в localStorage
2. Используйте HTTPS для всех запросов
3. Очищайте Object URLs после использования
4. Логируйте все операции для аудита

## Тестирование

### Unit тесты (Backend)

```typescript
describe('CdekService - printBarcode', () => {
  it('должен сформировать ШК места по UUID', async () => {
    const dto = {
      orders: [{ order_uuid: 'test-uuid' }],
      format: 'A4',
      lang: 'RUS',
      copy_count: 1
    };
    const result = await cdekService.printBarcode(dto);
    expect(result.uuid).toBeDefined();
    expect(result.pdfBase64).toBeDefined();
  });

  it('должен выбросить ошибку при превышении лимита заказов', async () => {
    const dto = {
      orders: new Array(101).fill({ order_uuid: 'test' }),
      format: 'A4'
    };
    await expect(cdekService.printBarcode(dto)).rejects.toThrow();
  });
});
```

### E2E тесты (Frontend)

```typescript
describe('OrdersView - Печать ШК места', () => {
  it('должен открыть PDF в новом окне при клике на кнопку', async () => {
    const { getByTitle } = render(OrdersView);
    const printBtn = getByTitle('Печать ШК места');
    
    await fireEvent.click(printBtn);
    
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('blob:'),
        '_blank'
      );
    });
  });
});
```

## Логирование

### Backend логи

```
[Nest] 12345  - 22.10.2024, 10:00:00 LOG [CdekService] Запрос на формирование ШК места к заказу
[Nest] 12345  - 22.10.2024, 10:00:01 LOG [CdekService] Отправка запроса на формирование ШК места
[Nest] 12345  - 22.10.2024, 10:00:02 LOG [CdekService] ШК места создан с UUID: a1b2c3d4-e5f6-7890
[Nest] 12345  - 22.10.2024, 10:00:03 LOG [CdekService] Проверка статуса ШК места (попытка 1/30)
[Nest] 12345  - 22.10.2024, 10:00:03 LOG [CdekService] Текущий статус ШК места: PROCESSING
[Nest] 12345  - 22.10.2024, 10:00:05 LOG [CdekService] Проверка статуса ШК места (попытка 2/30)
[Nest] 12345  - 22.10.2024, 10:00:05 LOG [CdekService] Текущий статус ШК места: READY
[Nest] 12345  - 22.10.2024, 10:00:05 LOG [CdekService] ШК места успешно сформирован, скачиваем PDF...
[Nest] 12345  - 22.10.2024, 10:00:06 LOG [CdekService] PDF ШК места скачан успешно, размер: 25340 байт
```

## Дополнительные материалы

- [Официальная документация CDEK API](https://api-docs.cdek.ru/63345430.html)
- [Руководство по печати накладных](./WAYBILL_PRINT_GUIDE.md)
- [Общее руководство по интеграции](./ORDER_INTEGRATION_README.md)
