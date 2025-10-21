<script setup lang="ts">
import Table from '../components/Table.vue'
import { onMounted, ref, computed } from 'vue'
import { mdiTrayArrowDown } from '@mdi/js'
import { useRouter } from 'vue-router'
import { cdekService } from '../services/cdek.service'

const router = useRouter()
const goToTrack = () => router.push('/track')

// Определение тарифов CDEK
const TARIFF_NAMES: Record<number, string> = {
  136: 'СДЭК-ПВЗ',
  137: 'СДЭК-Курьер',
  138: 'СДЭК-Экономичная ПВЗ',
  139: 'СДЭК-Экономичная Курьер',
  // Добавьте другие коды тарифов по необходимости
}

const columns = [
  { key: 'date', label: 'Дата', width: 96, sortable: true },
  { key: 'carrier', label: 'ТК', width: 180, sortable: true },
  { key: 'orderNo', label: '№ заказа', width: 110, align: 'right', sortable: true, format: 'link' },
  {
    key: 'track',
    label: 'Трек номер ТК',
    width: 140,
    align: 'right',
    sortable: true,
    format: 'link',
  },
  { key: 'recipient', label: 'Получатель', width: 160, sortable: true },
  { key: 'phone', label: 'Телефон', width: 160, sortable: true },
  { key: 'address', label: 'Адрес', width: 520, ellipsis: true },
  {
    key: 'cod',
    label: 'Налож. платеж',
    width: 120,
    align: 'right',
    sortable: true,
    format: 'money',
  },
  { key: 'rate', label: 'Тариф', width: 100, align: 'right', sortable: true, format: 'money' },
  { key: 'status', label: 'Статус', width: 110, sortable: true, format: 'status' },
  { key: 'actions', label: 'Действия', width: 100, align: 'center' },
]

// Состояние загрузки
const loading = ref(false)
const error = ref<string | null>(null)
const apiOrders = ref<any[]>([])

// Функция для форматирования даты
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

// Функция для маппинга данных из API в формат таблицы
const mapOrderToRow = (order: any) => {
  const recipient = order.recipientJson || {}
  const toLocation = order.toLocationJson || {}
  
  // Извлекаем адрес
  let address = ''
  if (toLocation.address) {
    address = toLocation.address
  } else if (order.deliveryPoint) {
    address = `ПВЗ: ${order.deliveryPoint}`
  }
  
  // Извлекаем телефон
  const phones = recipient.phones || []
  const phone = phones.length > 0 ? phones[0].number : ''
  
  // Получаем название тарифа
  const carrier = TARIFF_NAMES[order.tariffCode] || `СДЭК (${order.tariffCode})`
  
  // Статус из requests
  const status = order.requestState || 'Создан'
  
  return {
    id: order.id,
    uuid: order.uuid, // Добавляем UUID для печати
    cdekNumber: order.cdekNumber, // Добавляем CDEK номер для печати
    date: formatDate(order.createdAt),
    carrier,
    orderNo: order.number || order.uuid || '-',
    track: order.cdekNumber || '-',
    recipient: recipient.name || '-',
    phone: phone || '-',
    address: address || '-',
    cod: '-', // Если есть данные о наложенном платеже, добавить сюда
    rate: '-', // Если есть данные о стоимости, добавить сюда
    status,
  }
}

// Состояние для печати документов
const printingWaybills = ref<Set<number>>(new Set())
const printingBarcodes = ref<Set<number>>(new Set())

// Функция печати накладной для конкретного заказа
const printWaybill = async (row: any) => {
  if (!row.uuid && !row.cdekNumber) {
    error.value = 'Не удается распечатать накладную: отсутствует UUID или номер CDEK'
    return
  }

  printingWaybills.value.add(row.id)
  error.value = null

  try {
    const orders = []
    
    if (row.uuid) {
      orders.push({ order_uuid: row.uuid, copy_count: 2 })
    } else if (row.cdekNumber) {
      orders.push({ cdek_number: row.cdekNumber, copy_count: 2 })
    }

    const result = await cdekService.printWaybill(orders, 'tpl_russia')

    // Приоритет: используем pdfBase64 если доступен, иначе URL
    if (result.pdfBase64) {
      // Скачиваем PDF из Base64
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      // Открываем в новом окне
      window.open(url, '_blank')
      
      // Очищаем URL через 1 минуту
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } else if (result.url) {
      // Fallback: открываем по ссылке из CDEK
      window.open(result.url, '_blank')
    } else {
      throw new Error('Не получен PDF файл или ссылка на накладную')
    }
  } catch (err: any) {
    console.error('Ошибка при печати накладной:', err)
    error.value = err.message || 'Не удалось распечатать накладную'
  } finally {
    printingWaybills.value.delete(row.id)
  }
}

// Функция печати ШК места для конкретного заказа
const printBarcode = async (row: any) => {
  if (!row.uuid && !row.cdekNumber) {
    error.value = 'Не удается распечатать ШК места: отсутствует UUID или номер CDEK'
    return
  }

  printingBarcodes.value.add(row.id)
  error.value = null

  try {
    const orders = []
    
    if (row.uuid) {
      orders.push({ order_uuid: row.uuid })
    } else if (row.cdekNumber) {
      orders.push({ cdek_number: row.cdekNumber })
    }

    const result = await cdekService.printBarcode(orders, 'A4', 'RUS', 1)

    // Приоритет: используем pdfBase64 если доступен, иначе URL
    if (result.pdfBase64) {
      // Скачиваем PDF из Base64
      const byteCharacters = atob(result.pdfBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      // Открываем в новом окне
      window.open(url, '_blank')
      
      // Очищаем URL через 1 минуту
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } else if (result.url) {
      // Fallback: открываем по ссылке из CDEK
      window.open(result.url, '_blank')
    } else {
      throw new Error('Не получен PDF файл или ссылка на ШК места')
    }
  } catch (err: any) {
    console.error('Ошибка при печати ШК места:', err)
    error.value = err.message || 'Не удалось распечатать ШК места'
  } finally {
    printingBarcodes.value.delete(row.id)
  }
}

// Проверка, печатается ли документ для конкретной строки
const isPrintingWaybill = (rowId: number) => {
  return printingWaybills.value.has(rowId)
}

const isPrintingBarcode = (rowId: number) => {
  return printingBarcodes.value.has(rowId)
}

// Mock данные для fallback
const mockRows = [
  {
    id: 1,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 2,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 3,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 4,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 5,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 6,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 7,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 8,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 9,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 10,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 11,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 12,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 13,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 14,
    date: '30.09.2024',
    carrier: '  СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 15,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 16,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 17,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 18,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 19,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 20,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 21,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 22,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
  {
    id: 23,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '55555',
    track: '10035628390',
    recipient: 'Таграмян',
    phone: '7999999999',
    address: 'Москва, ул. 2-я Владимирская, 6, корп.1',
    cod: '-',
    rate: 695,
    status: 'Отменён',
  },
  {
    id: 24,
    date: '30.09.2024',
    carrier: 'СДЭК-PВЗ',
    orderNo: '03322222',
    track: '10035625020',
    recipient: 'Мавлумян П',
    phone: '7999999999',
    address: 'Верхняя Красносельская, 17А, стр.15',
    cod: '-',
    rate: 695,
    status: 'Удален',
  },
]

// Функция загрузки заказов из API
const loadOrders = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params: any = {
      limit: 100,
      offset: 0,
    }
    
    if (dateFrom.value) {
      params.dateFrom = dateFrom.value
    }
    
    if (dateTo.value) {
      params.dateTo = dateTo.value
    }
    
    if (shipmentType.value !== 'all') {
      // Находим код тарифа по названию
      const tariffCode = Object.entries(TARIFF_NAMES).find(
        ([_, name]) => name === shipmentType.value
      )?.[0]
      
      if (tariffCode) {
        params.tariffCode = Number(tariffCode)
      }
    }
    
    const result = await cdekService.getOrdersList(params)
    apiOrders.value = result.orders
  } catch (err: any) {
    console.error('Ошибка при загрузке заказов:', err)
    error.value = err.message || 'Не удалось загрузить заказы'
    // В случае ошибки используем mock данные
    apiOrders.value = []
  } finally {
    loading.value = false
  }
}

// filters state
const shipmentType = ref<'all' | 'СДЭК-ПВЗ' | 'СДЭК-Курьер'>('all')
const dateFrom = ref('2024-09-01') // ISO for input[type=date]
const dateTo = ref('2024-10-31')

// helpers
const parseDDMMYYYY = (s: string) => {
  const [dd, mm, yyyy] = s.split('.').map(Number)
  return new Date(yyyy, (mm || 1) - 1, dd || 1)
}

// Объединяем данные: сначала реальные из API, потом mock для демо
const allRows = computed(() => {
  const apiRows = apiOrders.value.map(mapOrderToRow)
  // Используем только API данные, если они есть
  return apiRows.length > 0 ? apiRows : mockRows
})

// computed filtered rows
const filteredRows = computed(() => {
  const from = dateFrom.value ? new Date(dateFrom.value) : null
  const to = dateTo.value ? new Date(dateTo.value) : null
  return allRows.value.filter((r: any) => {
    if (shipmentType.value !== 'all' && r.carrier?.trim() !== shipmentType.value) return false
    const d = parseDDMMYYYY(r.date)
    if (from && d < from) return false
    if (to) {
      const toEnd = new Date(to)
      toEnd.setHours(23, 59, 59, 999)
      if (d > toEnd) return false
    }
    return true
  })
})

// export
const exportCsv = () => {
  const header = columns.map((c: any) => c.label).join(',')
  const csv = [header]
    .concat(
      filteredRows.value.map((r: any) =>
        [
          r.date,
          r.carrier,
          r.orderNo,
          r.track,
          r.recipient,
          r.phone,
          `"${(r.address || '').replace(/"/g, '""')}"`,
          r.cod,
          r.rate,
          r.status,
        ].join(','),
      ),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'orders.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const balance = '0'

// Наблюдатель за изменением фильтров - перезагружаем данные
const reloadOrders = () => {
  loadOrders()
}

onMounted(() => {
  console.log('OrdersView mounted successfully!')
  console.log('Columns:', columns.length)
  loadOrders()
})
</script>

<template>
  <div class="container">
    <div class="container--header">
      <p class="header-title">Список заказов</p>
      <div class="header-actions">
        <button class="track-btn" type="button" @click="goToTrack">
          Отслеживание заказа
        </button>
      </div>
    </div>

    <!-- filters bar -->
    <div class="filters">
      <div class="filters__left">
        <select class="f-select" v-model="shipmentType" @change="reloadOrders">
          <option value="all">Тип отправления</option>
          <option value="СДЭК-ПВЗ">СДЭК-ПВЗ</option>
          <option value="СДЭК-Курьер">СДЭК-Курьер</option>
        </select>

        <div class="f-range">
          <input class="f-date" type="date" v-model="dateFrom" @change="reloadOrders" />
          <span class="f-arrow">→</span>
          <input class="f-date" type="date" v-model="dateTo" @change="reloadOrders" />
        </div>
        
        <button class="reload-btn" type="button" @click="reloadOrders" :disabled="loading" title="Обновить">
          <span v-if="loading">⟳</span>
          <span v-else>↻</span>
        </button>
      </div>

      <button class="icon-btn" type="button" @click="exportCsv" title="Скачать CSV">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path :d="mdiTrayArrowDown" />
        </svg>
      </button>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Загрузка заказов...</p>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-if="error && !loading" class="error-message">
      <p>⚠️ {{ error }}</p>
      <button @click="reloadOrders">Попробовать снова</button>
    </div>

    <!-- Таблица -->
    <Table v-if="!loading" :columns="columns" :rows="filteredRows" @update:selection="(ids: any) => console.log(ids)">
      <template #actions="{ row }">
        <div class="actions-buttons">
          <button 
            class="print-btn" 
            @click="printWaybill(row)"
            :disabled="isPrintingWaybill(row.id)"
            :title="isPrintingWaybill(row.id) ? 'Формирование накладной...' : 'Печать накладной'"
          >
            <span v-if="isPrintingWaybill(row.id)" class="print-spinner">⟳</span>
            <span v-else>📄</span>
          </button>
          <button 
            class="print-btn" 
            @click="printBarcode(row)"
            :disabled="isPrintingBarcode(row.id)"
            :title="isPrintingBarcode(row.id) ? 'Формирование ШК места...' : 'Печать ШК места'"
          >
            <span v-if="isPrintingBarcode(row.id)" class="print-spinner">⟳</span>
            <span v-else>📦</span>
          </button>
        </div>
      </template>
    </Table>
  </div>
  <div></div>
</template>

<style scoped>
.container {
  padding: 2px 16px;
  width: 100%;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 500px;
  z-index: 10;
}

h1 {
  margin-bottom: 20px;
  color: #2f343a;
  font-size: 24px;
  font-weight: 600;
}

.debug {
  background: white;
  padding: 20px;
  border: 2px solid #007bff;
  border-radius: 8px;
  margin: 20px 0;
}

.debug p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

.header-title {
  color: #9b9b9b;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.track-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  background: #1f402e;
  color: #fff;
  border: 1px solid #1f402e;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s, background .2s, border-color .2s;
}

.track-btn:hover {
  transform: translateY(-1px);
  background: #183323;
  border-color: #183323;
}

/* дальше ваши стили как были */
.filters {
  margin: 8px 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.filters__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.container--header {
  display: flex;
  justify-content: space-between;
}

/* filters */
.filters {
  margin: 8px 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.filters__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.f-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;

  background-color: #fff;

  /* arrow icon */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px 16px;

  /* ensure space for the arrow */
  padding-right: 40px;

  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 14px;
  padding: 8px 36px 8px 12px;
  border-radius: 8px;
  position: relative;
  min-width: 180px;
}

.f-select:focus {
  outline: none;
  border-color: #d1d5db;
}

.f-range {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 6px 10px;
  position: relative;
}

.f-date {
  border: 0;
  padding: 2px;
  font-size: 14px;
  color: #2a2f36;
  background: transparent;
}

.f-date:focus {
  outline: none;
}

.f-arrow {
  color: #9ca3af;
  font-size: 14px;
}

.f-cal {
  color: #9ca3af;
  margin-left: 6px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.icon-btn:hover {
  filter: brightness(0.98);
}

.icon-btn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.balance--green {
  color: #41d878;
  font-weight: 600;
}

/* Loading overlay */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  margin: 20px 0;
}

.loading-overlay p {
  margin-top: 16px;
  color: #6b7280;
  font-size: 14px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #1f402e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Error message */
.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  text-align: center;
}

.error-message p {
  color: #c33;
  margin-bottom: 12px;
  font-size: 14px;
}

.error-message button {
  padding: 8px 16px;
  background: #1f402e;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.error-message button:hover {
  background: #183323;
}

/* Reload button */
.reload-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 18px;
  transition: all 0.2s;
}

.reload-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.reload-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.reload-btn span {
  display: inline-block;
  animation: rotate 1s linear infinite;
}

.reload-btn:not(:disabled) span {
  animation: none;
}

@keyframes rotate {
  to { transform: rotate(360deg); }
}

/* Actions buttons container */
.actions-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

/* Print buttons */
.print-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
  padding: 0;
}

.print-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #1f402e;
  transform: translateY(-1px);
}

.print-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  background: #f3f4f6;
}

.print-spinner {
  display: inline-block;
  animation: rotate 1s linear infinite;
}
</style>