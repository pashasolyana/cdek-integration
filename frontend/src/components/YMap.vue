<script setup lang="ts">
import {
  YandexMap,
  YandexMapClusterer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultSchemeLayer,
  YandexMapMarker,
} from 'vue-yandex-maps'
import { onMounted, ref, shallowRef, version, watch, computed } from 'vue'
import type { YMap } from '@yandex/ymaps3-types'
import type { YMapClusterer } from '@yandex/ymaps3-types/packages/clusterer'
import { cdekService } from '@/services/cdek.service'

interface DeliveryPoint {
  uuid: string
  code: string
  type: string
  city: string
  address: string
  addressFull: string
  latitude: number
  longitude: number
  weightMin: number | null
  weightMax: number | null
  phones: Array<{ number: string; addl: string | null }>
  workTimes: Array<{ day: number; time: string }>
  isHandout: boolean | null
  isReception: boolean | null
  haveCash: boolean | null
  haveCashless: boolean | null
}

const deliveryPoints = ref<DeliveryPoint[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedPoint = ref<DeliveryPoint | null>(null)
const showInfo = ref(false)
const isInitialLoad = ref(true)

const pointList = computed(() => {
  return deliveryPoints.value
    .filter(dp => dp.longitude && dp.latitude)
    .map(dp => ({
      coordinates: [dp.longitude, dp.latitude] as [number, number],
      data: dp
    }))
})

const mapCenter = ref<[number, number]>([37.617644, 55.755819]) // Москва по умолчанию
const mapZoom = ref(10)

const map = shallowRef<YMap | null>(null)
const clusterer = shallowRef<YMapClusterer | null>(null)
const gridSize = ref(6)
const zoom = ref(0)

// Debounce для избежания частых запросов
let loadTimeout: ReturnType<typeof setTimeout> | null = null

// Получение границ видимой области карты
const getMapBounds = () => {
  if (!map.value) {
    console.log('⚠️ map.value отсутствует')
    return null
  }
  
  try {
    const bounds = map.value.bounds
    console.log('📍 Текущие bounds карты:', bounds)
    
    if (!bounds || bounds.length !== 2) {
      console.warn('⚠️ bounds некорректны:', bounds)
      return null
    }
    
    // bounds = [[lon_min, lat_min], [lon_max, lat_max]]
    const result = {
      lon_min: bounds[0][0],
      lat_min: bounds[0][1],
      lon_max: bounds[1][0],
      lat_max: bounds[1][1]
    }
    
    console.log('📦 Рассчитанные границы:', result)
    return result
  } catch (e) {
    console.error('❌ Ошибка получения границ карты:', e)
    return null
  }
}

// Загрузка пунктов выдачи для текущей области карты
const loadDeliveryPointsForCurrentView = async () => {
  console.log('🔄 Начало загрузки точек...')
  
  const bounds = getMapBounds()
  if (!bounds) {
    console.warn('⚠️ Не удалось получить границы карты, пропускаем загрузку')
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    console.log('📡 Запрос к API с параметрами:', {
      lat_min: bounds.lat_min,
      lat_max: bounds.lat_max,
      lon_min: bounds.lon_min,
      lon_max: bounds.lon_max,
      limit: 1000
    })
    
    const response = await cdekService.getDeliveryPointsFromDb({
      lat_min: bounds.lat_min,
      lat_max: bounds.lat_max,
      lon_min: bounds.lon_min,
      lon_max: bounds.lon_max,
      limit: 1000,
      offset: 0
    })
    
    console.log('📥 Ответ от API:', response)
    
    if (response.rows && response.rows.length > 0) {
      deliveryPoints.value = response.rows
      console.log(`✅ Загружено ${response.rows.length} точек для текущей области`)
      console.log('📍 Первая точка:', response.rows[0])
    } else {
      deliveryPoints.value = []
      console.log('⚠️ В текущей области нет пунктов выдачи')
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки пунктов выдачи'
    console.error('❌ Ошибка загрузки ПВЗ:', e)
    console.error('❌ Детали ошибки:', e.response?.data)
  } finally {
    loading.value = false
  }
}

// Загрузка с debounce
const debouncedLoadPoints = () => {
  if (loadTimeout) {
    clearTimeout(loadTimeout)
  }
  
  loadTimeout = setTimeout(() => {
    loadDeliveryPointsForCurrentView()
  }, 500) // Задержка 500мс после остановки перемещения карты
}

// Обработчик изменения области просмотра
const handleMapUpdate = () => {
  if (isInitialLoad.value) {
    // Пропускаем первое обновление при инициализации
    return
  }
  debouncedLoadPoints()
}

// Получение информации о типе точки
const getPointTypeLabel = (type: string) => {
  switch (type) {
    case 'PVZ': return 'ПВЗ'
    case 'POSTAMAT': return 'Постамат'
    default: return type
  }
}

// Дедупликация и лимит для телефонов
const getUniquePhones = (phones: Array<{ number: string; addl: string | null }>) => {
  if (!phones || phones.length === 0) return []
  
  const seen = new Set<string>()
  const unique: Array<{ number: string; addl: string | null }> = []
  
  for (const phone of phones) {
    const key = `${phone.number}-${phone.addl || ''}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(phone)
    }
  }
  
  return unique.slice(0, 3) // Максимум 3 телефона
}

// Форматирование номера телефона
const formatPhoneNumber = (phone: string) => {
  // Приводим к формату +7 (XXX) XXX-XX-XX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
  }
  return phone
}

// Группировка расписания по дням
const groupWorkTimes = (workTimes: Array<{ day: number; time: string }>) => {
  if (!workTimes || workTimes.length === 0) return []
  
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  const grouped: Record<string, Set<number>> = {}
  
  // Собираем уникальные дни для каждого времени
  workTimes.forEach(wt => {
    const time = wt.time
    if (!grouped[time]) {
      grouped[time] = new Set()
    }
    grouped[time].add(wt.day)
  })
  
  return Object.entries(grouped).map(([time, daySet]) => {
    const sortedDays = Array.from(daySet).sort((a, b) => a - b)
    
    // Группируем последовательные дни
    const ranges: string[] = []
    let i = 0
    
    while (i < sortedDays.length) {
      const start = sortedDays[i]
      let end = start
      
      // Ищем конец последовательности
      while (i + 1 < sortedDays.length && sortedDays[i + 1] === sortedDays[i] + 1) {
        i++
        end = sortedDays[i]
      }
      
      // Форматируем диапазон
      if (start === end) {
        ranges.push(days[start - 1])
      } else if (end === start + 1) {
        // Два подряд идущих дня - разделяем запятой
        ranges.push(`${days[start - 1]}, ${days[end - 1]}`)
      } else {
        // Диапазон из 3+ дней - используем тире
        ranges.push(`${days[start - 1]}–${days[end - 1]}`)
      }
      
      i++
    }
    
    return {
      days: ranges.join(', '),
      time: time
    }
  })
}

// Обработка клика по маркеру
const handleMarkerClick = (point: DeliveryPoint) => {
  selectedPoint.value = point
  showInfo.value = true
}

// Закрытие информационной панели
const closeInfo = () => {
  showInfo.value = false
  selectedPoint.value = null
}

// Тестовая загрузка всех точек (для отладки)
const loadAllPoints = async () => {
  console.log('🔍 Тестовая загрузка всех точек...')
  loading.value = true
  error.value = null
  
  try {
    const response = await cdekService.getDeliveryPointsFromDb({
      limit: 1000,
      offset: 0
    })
    
    console.log('📥 Получено точек:', response.total || response.rows?.length || 0)
    
    if (response.rows && response.rows.length > 0) {
      deliveryPoints.value = response.rows
      console.log(`✅ Загружено ${response.rows.length} точек (всего)`)
      
      // Центрируем карту на первой точке
      const firstPoint = response.rows[0]
      if (firstPoint.longitude && firstPoint.latitude) {
        mapCenter.value = [firstPoint.longitude, firstPoint.latitude]
        console.log('🎯 Карта центрирована на:', mapCenter.value)
      }
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка загрузки'
    console.error('❌ Ошибка:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  console.log('🚀 Компонент YMap монтируется...')
  
  if (version.startsWith('2')) {
    console.warn('⚠️ Vue версии 2 обнаружена, некоторые функции могут не работать')
    return
  }
  
  // Ждём инициализации карты
  console.log('⏳ Ожидание инициализации карты...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Загружаем точки для текущей области после инициализации
  if (map.value) {
    console.log('✅ Карта инициализирована, загружаем точки')
    isInitialLoad.value = false
    await loadDeliveryPointsForCurrentView()
  } else {
    console.warn('⚠️ Карта не инициализирована после таймаута')
  }
  
  setInterval(() => {
    if (map.value) {
      zoom.value = map.value.zoom
    }
  }, 1000)
})

watch(map, (val) => {
  console.log('🗺️ Map watch triggered, значение:', val ? 'есть' : 'нет')
  if (val && isInitialLoad.value) {
    // Карта инициализирована, загружаем точки
    console.log('✅ Карта готова в watch, загружаем точки через 1 секунду')
    setTimeout(async () => {
      isInitialLoad.value = false
      await loadDeliveryPointsForCurrentView()
    }, 1000)
  }
})

watch(clusterer, (val) => console.log('📍 Clusterer:', val ? 'инициализирован' : 'нет'))

// Отслеживаем изменения bounds карты (перемещение, зум)
watch(() => map.value?.bounds, (newBounds) => {
  console.log('🔄 Bounds изменились:', newBounds)
  handleMapUpdate()
}, { deep: true })

</script>

<template>
  <div class="map-container">
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">Загрузка пунктов выдачи...</div>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- Панель управления -->
    <div class="map-controls">
      <div class="points-counter">
        <span class="counter-label">Точек на карте:</span>
        <span class="counter-value">{{ deliveryPoints.length }}</span>
      </div>
      <button 
        class="refresh-btn" 
        @click="loadDeliveryPointsForCurrentView"
        :disabled="loading"
        title="Обновить точки для текущей области"
      >
        <span v-if="!loading">↻</span>
        <span v-else>⟳</span>
      </button>
      <button 
        class="test-btn" 
        @click="loadAllPoints"
        :disabled="loading"
        title="Загрузить все точки (тест)"
      >
        🔍
      </button>
    </div>

    <!-- Карта -->
    <yandex-map
      v-model="map"
      cursor-grab
      height="100%"
      :settings="{
        location: {
          center: mapCenter,
          zoom: mapZoom,
        },
      }"
      width="100%"
    >
      <yandex-map-default-scheme-layer />
      <yandex-map-default-features-layer />
      <yandex-map-clusterer
        v-model="clusterer"
        :grid-size="2 ** gridSize"
        zoom-on-cluster-click
      >
        <yandex-map-marker
          v-for="point in pointList"
          :key="point.data.uuid"
          :settings="{
            coordinates: point.coordinates,
            onClick: () => handleMarkerClick(point.data),
          }"
        >
          <div
            class="marker"
            :class="{ 'marker-postamat': point.data.type === 'POSTAMAT' }"
          />
        </yandex-map-marker>
        <template #cluster="{ length }">
          <div class="cluster fade-in">
            {{ length }}
          </div>
        </template>
      </yandex-map-clusterer>
    </yandex-map>

    <!-- Информационная панель -->
    <transition name="slide">
      <div v-if="showInfo && selectedPoint" class="info-panel">
        <button class="close-btn" @click="closeInfo" aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        
        <!-- Заголовок с типом -->
        <div class="info-header">
          <span class="point-type-badge" :class="'type-' + selectedPoint.type.toLowerCase()">
            {{ getPointTypeLabel(selectedPoint.type) }}
          </span>
          <h3 class="info-title">{{ selectedPoint.code }}</h3>
        </div>

        <!-- Основная информация -->
        <div class="info-body">
          <!-- Адрес -->
          <div class="info-section">
            <div class="info-row">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10C11.1046 10 12 9.10457 12 8C12 6.89543 11.1046 6 10 6C8.89543 6 8 6.89543 8 8C8 9.10457 8.89543 10 10 10Z" fill="currentColor"/>
                <path d="M10 2C6.13401 2 3 5.13401 3 9C3 13.25 10 18 10 18C10 18 17 13.25 17 9C17 5.13401 13.866 2 10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="info-content">
                <div class="info-label">Адрес</div>
                <div class="info-value">{{ selectedPoint.addressFull || selectedPoint.address }}</div>
                <div class="info-sublabel">{{ selectedPoint.city }}</div>
              </div>
            </div>
          </div>

          <!-- Телефоны -->
          <div v-if="selectedPoint.phones && selectedPoint.phones.length > 0" class="info-section">
            <div class="info-row">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5.5 4C4.67157 4 4 4.67157 4 5.5V6.5C4 11.7467 8.25329 16 13.5 16H14.5C15.3284 16 16 15.3284 16 14.5V13C16 12.4477 15.5523 12 15 12H13C12.4477 12 12 12.4477 12 13V13.5C12 13.7761 11.7761 14 11.5 14C9.01472 14 7 11.9853 7 9.5C7 9.22386 7.22386 9 7.5 9H8C8.55228 9 9 8.55228 9 8V6C9 5.44772 8.55228 5 8 5H6.5C5.94772 5 5.5 4.55228 5.5 4Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              <div class="info-content">
                <div class="info-label">
                  Телефоны
                  <span v-if="selectedPoint.phones.length > 3" class="info-counter">
                    (показано 3 из {{ new Set(selectedPoint.phones.map(p => p.number)).size }})
                  </span>
                </div>
                <div v-for="(phone, idx) in getUniquePhones(selectedPoint.phones)" :key="idx" class="phone-item">
                  <a :href="'tel:' + phone.number" class="phone-link">{{ formatPhoneNumber(phone.number) }}</a>
                  <span v-if="phone.addl" class="phone-additional">доб. {{ phone.addl }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Режим работы -->
          <div v-if="selectedPoint.workTimes && selectedPoint.workTimes.length > 0" class="info-section">
            <div class="info-row">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 6V10L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
              <div class="info-content">
                <div class="info-label">Режим работы</div>
                <div class="work-time-list">
                  <div v-for="(schedule, idx) in groupWorkTimes(selectedPoint.workTimes)" :key="idx" class="work-time-item">
                    <span class="work-days">{{ schedule.days }}</span>
                    <span class="work-time-separator">•</span>
                    <span class="work-hours">{{ schedule.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Возможности -->
          <div class="info-section">
            <div class="info-row">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M16 8L9 15L4 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="info-content">
                <div class="info-label">Возможности</div>
                <div class="capabilities">
                  <span v-if="selectedPoint.isHandout" class="capability-badge capability-success">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11 4L5.5 9.5L3 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Выдача
                  </span>
                  <span v-if="selectedPoint.isReception" class="capability-badge capability-info">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 3V7M7 10H7.007" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    Приём
                  </span>
                  <span v-if="selectedPoint.haveCash" class="capability-badge capability-warning">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="4" width="10" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
                      <circle cx="7" cy="7" r="1" fill="currentColor"/>
                    </svg>
                    Наличные
                  </span>
                  <span v-if="selectedPoint.haveCashless" class="capability-badge capability-primary">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="3" width="10" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M2 6H12" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    Безналичные
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Вес грузов -->
          <div v-if="selectedPoint.weightMin || selectedPoint.weightMax" class="info-section">
            <div class="info-row">
              <svg class="info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 7L10 3L16 7M4 13L10 17L16 13M4 7V13M16 7V13M10 3V17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="info-content">
                <div class="info-label">Вес грузов</div>
                <div class="info-value">
                  <span v-if="selectedPoint.weightMin">от {{ selectedPoint.weightMin }} кг</span>
                  <span v-if="selectedPoint.weightMin && selectedPoint.weightMax"> • </span>
                  <span v-if="selectedPoint.weightMax">до {{ selectedPoint.weightMax }} кг</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  padding: 20px 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  color: #333;
}

.error-message {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4444;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1001;
}

.map-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 1000;
}

.points-counter {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.counter-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.counter-value {
  font-size: 18px;
  font-weight: 700;
  color: #00B956;
}

.refresh-btn {
  background: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #00B956;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #00B956;
  color: white;
  transform: scale(1.05);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-btn span {
  display: inline-block;
}

.refresh-btn:disabled span {
  animation: spin 1s linear infinite;
}

.test-btn {
  background: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #FF6B00;
  transform: scale(1.05);
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.bounds {
  user-select: all;
}

.marker {
  background: #00B956;
  border-radius: 100%;
  width: 24px;
  height: 24px;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s;
}

.marker:hover {
  transform: scale(1.2);
}

.marker-postamat {
  background: #FF6B00;
}

.cluster {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 50px;
  min-height: 50px;
  background: #00B956;
  color: #fff;
  border-radius: 100%;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  padding: 5px;
}

.info-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 420px;
  max-height: calc(100% - 40px);
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #666;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: scale(1.1);
}

.info-header {
  padding: 24px 24px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-bottom: 1px solid #eee;
}

.point-type-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.type-pvz {
  background: linear-gradient(135deg, #00B956 0%, #00A050 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 185, 86, 0.3);
}

.type-postamat {
  background: linear-gradient(135deg, #FF6B00 0%, #E65100 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 0, 0.3);
}

.info-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  padding-right: 40px;
  line-height: 1.3;
}

.info-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
}

.info-section {
  margin-bottom: 24px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.info-icon {
  flex-shrink: 0;
  color: #00B956;
  margin-top: 2px;
}

.info-content {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-counter {
  font-size: 10px;
  color: #00B956;
  font-weight: 600;
  background: rgba(0, 185, 86, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: none;
}

.info-value {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  font-weight: 500;
}

.info-sublabel {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.phone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.2s;
  border: 1px solid #A5D6A7;
}

.phone-item:last-child {
  margin-bottom: 0;
}

.phone-item:hover {
  background: linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 185, 86, 0.2);
}

.phone-link {
  color: #2E7D32;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  transition: color 0.2s;
  flex: 1;
}

.phone-link:hover {
  color: #1B5E20;
}

.phone-additional {
  color: #558B2F;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
}

.work-time-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.work-time-item {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
  border-radius: 10px;
  border: 1px solid #FFE082;
  font-size: 14px;
  transition: all 0.2s;
}

.work-time-item:hover {
  background: linear-gradient(135deg, #FFECB3 0%, #FFE082 100%);
  border-color: #FFC107;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
}

.work-days {
  font-weight: 700;
  color: #F57C00;
  min-width: fit-content;
  letter-spacing: 0.3px;
}

.work-time-separator {
  color: #FFA000;
  font-weight: 700;
  font-size: 16px;
}

.work-hours {
  color: #E65100;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  text-align: left;
}

.capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.capability-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.capability-badge svg {
  flex-shrink: 0;
}

.capability-success {
  background: #E8F5E9;
  color: #2E7D32;
  border: 1px solid #C8E6C9;
}

.capability-info {
  background: #E3F2FD;
  color: #1565C0;
  border: 1px solid #BBDEFB;
}

.capability-warning {
  background: #FFF3E0;
  color: #E65100;
  border: 1px solid #FFE0B2;
}

.capability-primary {
  background: #F3E5F5;
  color: #6A1B9A;
  border: 1px solid #E1BEE7;
}

.capability-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.fade-in {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 768px) {
  .info-panel {
    width: calc(100% - 40px);
    max-height: 50%;
    top: auto;
    bottom: 20px;
    right: 20px;
    left: 20px;
  }

  .map-controls {
    top: 10px;
    left: 10px;
    gap: 8px;
  }

  .points-counter {
    padding: 8px 12px;
    font-size: 12px;
  }

  .counter-label {
    display: none;
  }

  .counter-value {
    font-size: 16px;
  }

  .refresh-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}
</style>
