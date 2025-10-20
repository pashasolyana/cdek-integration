<script setup lang="ts">
import cdekImage from '../assets/images/cdek.jpg'
import noImage from '../assets/images/no-image.jpg'

const props = defineProps<{
  PVZName: string
  address: string
}>()

let PVZImage = ''

switch (props.PVZName) {
  case 'СДЭК':
    PVZImage = cdekImage
    break
  default:
    PVZImage = noImage
    break
}
</script>

<template>
  <div class="card-container">
    <div class="info-container">
      <div class="info">
        <h3>{{ PVZName }}</h3>
        <p>{{ address }}</p>
      </div>
      <img :src="PVZImage" :alt="noImage" class="image" />
    </div>
    <div class="btn-container">
      <button class="btn" @click="">Выбрать</button>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 110px;
  padding: 10px;
  background: #f6f6f6;
  border-radius: 5px;
  gap: 10px;
}

.info-container {
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.info {
  display: flex;
  flex-direction: column;
}

.image {
  height: 50px;
  width: auto;
  border-radius: 5px;
}

.btn-container {
  width: 100%;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn {
  width: 100%;
  height: 35px;
  background-color: #344e41;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}
</style>
