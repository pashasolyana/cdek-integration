<script setup lang="ts">
import Table from '../components/Table.vue'
import { onMounted } from 'vue'

const columns = [
  { key: 'date', label: 'Дата', width: 96, sortable: true },
  { key: 'carrier', label: 'ТК', width: 180, sortable: true },
  { key: 'orderNo', label: '№ заказа', width: 110, align: 'right', sortable: true, format: 'link' },
  { key: 'track', label: 'Трек номер ТК', width: 140, align: 'right', sortable: true, format: 'link' },
  { key: 'recipient', label: 'Получатель', width: 160, sortable: true },
  { key: 'phone', label: 'Телефон', width: 160, sortable: true },
  { key: 'address', label: 'Адрес', width: 520, ellipsis: true },
  { key: 'cod', label: 'Налож. платеж', width: 120, align: 'right', sortable: true, format: 'money' },
  { key: 'rate', label: 'Тариф', width: 100, align: 'right', sortable: true, format: 'money' },
  { key: 'status', label: 'Статус', width: 110, sortable: true, format: 'status' },
]

const rows = [
  { id: 1, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 2, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 3, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 4, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 5, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 6, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 7, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 8, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 9, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 10, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 11, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 12, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 13, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 14, date:'30.09.2024', carrier:'  СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 15, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 16, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 17, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 18, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 19, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 20, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 21, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 22, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
  { id: 23, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'55555', track:'10035628390', recipient:'Таграмян', phone:'7999999999', address:'Москва, ул. 2-я Владимирская, 6, корп.1', cod:'-', rate:695, status:'Отменён' },
  { id: 24, date:'30.09.2024', carrier:'СДЭК-ПВЗ', orderNo:'03322222', track:'10035625020', recipient:'Мавлумян П', phone:'7999999999', address:'Верхняя Красносельская, 17А, стр.15', cod:'-', rate:695, status:'Удален' },
]

onMounted(() => {
  console.log('HomeView mounted successfully!')
  console.log('Columns:', columns.length)
  console.log('Rows:', rows.length)
})
</script>

<template>
  <div class="container">
    <h1>Заказы</h1>

    <Table :columns="columns" :rows="rows" @update:selection="(ids: any) => console.log(ids)"></Table>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 500px;
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
</style>

