<script setup lang="ts">
import Table from '../components/Table.vue'
import { onMounted, ref, computed } from 'vue'
import { mdiTrayArrowDown } from '@mdi/js'

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
]

const rows = [
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

// filters state
const shipmentType = ref<'all' | 'СДЭК-ПВЗ' | 'СДЭК-Курьер'>('all')
const dateFrom = ref('2024-09-01') // ISO for input[type=date]
const dateTo = ref('2024-10-31')

// helpers
const parseDDMMYYYY = (s: string) => {
  const [dd, mm, yyyy] = s.split('.').map(Number)
  return new Date(yyyy, (mm || 1) - 1, dd || 1)
}

// computed filtered rows
const filteredRows = computed(() => {
  const from = dateFrom.value ? new Date(dateFrom.value) : null
  const to = dateTo.value ? new Date(dateTo.value) : null
  return rows.filter((r: any) => {
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

onMounted(() => {
  console.log('HomeView mounted successfully!')
  console.log('Columns:', columns.length)
  console.log('Rows:', rows.length)
})
</script>

<template>
  <div class="container">
    <div class="container--header">
      <p class="header-title">Список заказов</p>
      <p class="balance">
        Баланс <span class="balance--green">{{ balance }} ₽</span>
      </p>
    </div>

    <!-- filters bar -->
    <div class="filters">
      <div class="filters__left">
        <select class="f-select" v-model="shipmentType">
          <option value="all">Тип отправления</option>
          <option value="СДЭК-ПВЗ">СДЭК-ПВЗ</option>
          <option value="СДЭК-Курьер">СДЭК-Курьер</option>
        </select>

        <div class="f-range">
          <input class="f-date" type="date" v-model="dateFrom" />
          <span class="f-arrow">→</span>
          <input class="f-date" type="date" v-model="dateTo" />
        </div>
      </div>

      <button class="icon-btn" type="button" @click="exportCsv" title="Скачать CSV">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path :d="mdiTrayArrowDown" />
        </svg>
      </button>
    </div>

    <Table
      :columns="columns"
      :rows="filteredRows"
      @update:selection="(ids: any) => console.log(ids)"
    ></Table>
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
</style>
