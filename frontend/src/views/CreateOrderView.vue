<script setup lang="ts">
import Dropdown from '@/components/Dropdown.vue'
import Input from '@/components/Input.vue'
import PVZCard from '@/components/PVZCard.vue'
import YMap from '@/components/YMap.vue'
import { onBeforeUnmount, onMounted, ref, watch, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import Autocomplete from '@/components/Autocomplete.vue'
import { dadataService, type DadataSuggestion } from '@/services/dadata.service'
import { cdekService, type CdekCity, type PackageItem } from '@/services/cdek.service'

const router = useRouter()
const toMain = () => router.push('/')

const isMapModalOpen = ref(false)
const mapContext = ref<'from' | 'to'>('to') // какой адрес редактируем
const mapDeliveryPoints = ref<any[]>([]) // точки выдачи для списка
const mapSearchQuery = ref('') // поиск по списку
watch(isMapModalOpen, (newVal) => {
  document.body.style.overflow = newVal ? 'hidden' : ''
  if (!newVal) {
    mapDeliveryPoints.value = [] // очищаем при закрытии
    mapSearchQuery.value = ''
  }
})

const handleEsc = (event: { key: string }) => {
  if (event.key === 'Escape' && isMapModalOpen.value) {
    isMapModalOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleEsc)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEsc)
})

const payer = ref<string | null>('sender') // Дефолт: отправитель платит

// Основные данные формы
const tradingCompany = ref<string | null>(null)
const deliveryMethod = ref<string | null>('door') // Дефолт: до двери

// ---------Обработка доступности инпутов

let isTK = ref(false)
watch(tradingCompany, (newVal) => {
  isTK.value = newVal !== null
})

let isDeliveryMethod = ref(false)
watch(deliveryMethod, (newVal) => {
  isDeliveryMethod.value = newVal !== null
})

// Адрес отправления
const fromCity = ref('')
const fromCityCode = ref<number | null>(null)
const fromCityName = ref('')
const fromCityLatitude = ref<number | undefined>(undefined)
const fromCityLongitude = ref<number | undefined>(undefined)
const fromCountryCode = ref('RU')
const fromCitySelected = ref(false)
const fromCitySuggestions = ref<Array<{ value: string; label: string; data: CdekCity }>>([])
const fromCityLoading = ref(false)
const fromAddress = ref('')
const fromAddressSuggestions = ref<Array<{ value: string; label: string; data: any }>>([])
const fromAddressLoading = ref(false)
const fromFlat = ref('')
const fromPostalCode = ref('')
const shipmentPoint = ref<string>('') // Код ПВЗ для самопривоза

// Адрес получателя
const toCity = ref('')
const toCityCode = ref<number | null>(null)
const toCityName = ref('')
const toCityLatitude = ref<number | undefined>(undefined)
const toCityLongitude = ref<number | undefined>(undefined)
const toCountryCode = ref('RU')
const toCitySelected = ref(false)
const toCitySuggestions = ref<Array<{ value: string; label: string; data: CdekCity }>>([])
const toCityLoading = ref(false)
const toAddress = ref('')
const toAddressSuggestions = ref<Array<{ value: string; label: string; data: any }>>([])
const toAddressLoading = ref(false)
const toFlat = ref('')
const toPostalCode = ref('')
const deliveryPoint = ref<string>('') // Код ПВЗ для получения

// Данные заказчика
const customerName = ref('')
const customerNameSuggestions = ref<Array<{ value: string; label: string; data: any }>>([])
const customerNameLoading = ref(false)
const customerPhone = ref('')

// Данные продавца
const sellerName = ref('')
const sellerNameSuggestions = ref<Array<{ value: string; label: string; data: any }>>([])
const sellerNameLoading = ref(false)
const sellerPhone = ref('')

// Посылки
interface Package {
  type: string | null
  weight: string
  length: string
  width: string
  height: string
}

interface PackageFieldErrors {
  weight: string
  length: string
  width: string
  height: string
}

interface TariffOption {
  tariff_code: number
  tariff_name: string
  tariff_description?: string
  delivery_mode: number | string
  delivery_sum: number
  period_min: number
  period_max: number
  calendar_min?: number
  calendar_max?: number
  delivery_date_range?: {
    min?: string
    max?: string
  }
  category?: string // Категория тарифа (Самый быстрый, Самый дешевый, Оптимальный)
}

// Режимы доставки для определения типа тарифа
enum DeliveryMode {
  DOOR_DOOR = 1, // от двери до двери
  DOOR_WAREHOUSE = 2, // от двери до склада (до ПВЗ)
  WAREHOUSE_DOOR = 3, // со склада до двери
  WAREHOUSE_WAREHOUSE = 4, // со склада до склада (до ПВЗ)
  DOOR_POSTAMAT = 6, // от двери до постамата (до ПВЗ)
}

// Функция определения, подходит ли тариф для выбранного способа доставки
const isTariffSuitableForDeliveryMethod = (tariff: TariffOption, method: string): boolean => {
  const mode = typeof tariff.delivery_mode === 'number' ? tariff.delivery_mode : parseInt(String(tariff.delivery_mode))
  
  if (method === 'door') {
    // До двери - только тарифы с доставкой до двери (mode 1 или 3)
    return mode === DeliveryMode.DOOR_DOOR || mode === DeliveryMode.WAREHOUSE_DOOR
  } else if (method === 'pvz') {
    // До ПВЗ - тарифы с доставкой до склада/постамата (mode 2, 4, 6)
    return mode === DeliveryMode.DOOR_WAREHOUSE || 
           mode === DeliveryMode.WAREHOUSE_WAREHOUSE || 
           mode === DeliveryMode.DOOR_POSTAMAT
  }
  
  return true // На всякий случай показываем все, если метод неизвестен
}

type AlertType = 'success' | 'error'

interface StatusAlert {
  type: AlertType
  message: string
}

const createEmptyPackage = (): Package => ({
  type: null,
  weight: '',
  length: '',
  width: '',
  height: '',
})

const createEmptyPackageErrors = (): PackageFieldErrors => ({
  weight: '',
  length: '',
  width: '',
  height: '',
})

const packages = ref<Package[]>([createEmptyPackage()])
const packageErrors = ref<PackageFieldErrors[]>([createEmptyPackageErrors()])

const formErrors = reactive({
  fromCity: '',
  toCity: '',
  fromAddress: '',
  toAddress: '',
  fromPostalCode: '',
  toPostalCode: '',
})

const calculationAlert = ref<StatusAlert | null>(null)
const orderAlert = ref<StatusAlert | null>(null)
const tariffResults = ref<TariffOption[]>([])
const selectedTariffCode = ref<number | null>(null)

// Стоимость
const estimatedCost = ref('')
const deliveryCost = ref('')
const markup = ref('')
const totalCost = ref('')

// Опции для дропдаунов
const tradingCompanyOptions = [
  { value: 'company1', label: 'ООО "Торговая компания 1"' },
  { value: 'company2', label: 'ИП Иванов И.И.' },
  { value: 'company3', label: 'ООО "Доставка+"' },
]

const payerOptions = [
  { value: 'sender', label: 'Отправитель' },
  { value: 'receiver', label: 'Получатель ' },
]

const deliveryMethodOptions = [
  { value: 'door', label: 'До двери' },
  { value: 'pvz', label: 'До ПВЗ' },
]

const packageTypeOptions = [
  { value: 'box', label: 'Коробка' },
  { value: 'envelope', label: 'Конверт' },
  { value: 'pallet', label: 'Паллета' },
]

const packageFieldKeys: Array<keyof PackageFieldErrors> = ['weight', 'length', 'width', 'height']

const packageFieldLabels: Record<keyof PackageFieldErrors, string> = {
  weight: 'Вес',
  length: 'Длина',
  width: 'Ширина',
  height: 'Высота',
}

const resetFieldErrors = () => {
  formErrors.fromCity = ''
  formErrors.toCity = ''
  formErrors.fromPostalCode = ''
  formErrors.toPostalCode = ''
  packageErrors.value = packages.value.map(() => createEmptyPackageErrors())
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)

const formatDeliveryDate = (date?: string) => {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
  })
}

const getDeliveryDateLabel = (range?: { min?: string; max?: string }) => {
  if (!range) return ''
  const { min, max } = range
  if (min && max && min !== max) {
    return `${formatDeliveryDate(min)} — ${formatDeliveryDate(max)}`
  }
  return formatDeliveryDate(min || max)
}

const getPeriodLabel = (tariff: TariffOption) => {
  const minDate = tariff.delivery_date_range?.min
  const maxDate = tariff.delivery_date_range?.max

  if (!minDate && !maxDate) return 'Срок уточняется'

  // Вычисляем количество дней от сегодня
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const calculateDays = (dateString: string) => {
    const targetDate = new Date(dateString)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const minDays = minDate ? calculateDays(minDate) : null
  const maxDays = maxDate ? calculateDays(maxDate) : null

  if (minDays === null && maxDays === null) return 'Срок уточняется'
  if (minDays === maxDays) return `${minDays} ${getDaysWord(minDays)}`
  if (minDays === null) return `до ${maxDays} ${getDaysWord(maxDays)}`
  if (maxDays === null) return `от ${minDays} ${getDaysWord(minDays)}`

  return `${minDays}–${maxDays} ${getDaysWord(maxDays)}`
}

const getDaysWord = (days: number | null) => {
  if (days === null) return 'дн.'
  const lastDigit = days % 10
  const lastTwoDigits = days % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'дней'
  if (lastDigit === 1) return 'день'
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня'
  return 'дней'
}

const updateTotals = (deliverySum: number) => {
  deliveryCost.value = deliverySum.toString()
  const baseCost = parseFloat(estimatedCost.value || '0')
  if (estimatedCost.value && !Number.isNaN(baseCost)) {
    const markupValue = baseCost * 0.1
    markup.value = markupValue.toFixed(2)
    totalCost.value = (baseCost + deliverySum + markupValue).toFixed(2)
  } else {
    markup.value = '0'
    totalCost.value = deliverySum.toString()
  }
}

const clearCalculationResults = () => {
  tariffResults.value = []
  selectedTariffCode.value = null
  deliveryCost.value = ''
  markup.value = ''
  totalCost.value = ''
}

const clearPackageError = (index: number, field: keyof PackageFieldErrors) => {
  if (!packageErrors.value[index]) return
  packageErrors.value[index][field] = ''
  calculationAlert.value = null
}

const resetOrderError = () => {
  if (orderAlert.value?.type === 'error') {
    orderAlert.value = null
  }
}

const selectTariff = (tariff: TariffOption) => {
  selectedTariffCode.value = tariff.tariff_code
  updateTotals(tariff.delivery_sum)
  orderAlert.value = null
  calculationAlert.value = {
    type: 'success',
    message: `Выбран тариф «${tariff.tariff_name}»`,
  }
}

// Определяем режим доставки по тарифу
const getDeliveryModeFromTariff = (tariff: TariffOption | undefined): number => {
  if (!tariff) return DeliveryMode.DOOR_DOOR
  return typeof tariff.delivery_mode === 'number' ? tariff.delivery_mode : DeliveryMode.DOOR_DOOR
}

// Проверяем, нужен ли адрес отправления (from_location)
const needsFromLocation = (mode: number): boolean => {
  return (
    mode === DeliveryMode.DOOR_DOOR ||
    mode === DeliveryMode.DOOR_WAREHOUSE ||
    mode === DeliveryMode.DOOR_POSTAMAT
  )
}

// Проверяем, нужен ли адрес получения (to_location)
const needsToLocation = (mode: number): boolean => {
  return mode === DeliveryMode.DOOR_DOOR || mode === DeliveryMode.WAREHOUSE_DOOR
}

// Проверяем, нужен ли shipment_point (ПВЗ отправки)
const needsShipmentPoint = (mode: number): boolean => {
  return mode === DeliveryMode.WAREHOUSE_DOOR || mode === DeliveryMode.WAREHOUSE_WAREHOUSE
}

// Проверяем, нужен ли delivery_point (ПВЗ получения)
const needsDeliveryPoint = (mode: number): boolean => {
  return (
    mode === DeliveryMode.DOOR_WAREHOUSE ||
    mode === DeliveryMode.WAREHOUSE_WAREHOUSE ||
    mode === DeliveryMode.DOOR_POSTAMAT
  )
}

// Таймауты для debounce
let citySearchTimeout: ReturnType<typeof setTimeout> | null = null
let addressSearchTimeout: ReturnType<typeof setTimeout> | null = null
let nameSearchTimeout: ReturnType<typeof setTimeout> | null = null

// Поиск городов CDEK
const searchFromCity = async (query: string) => {
  if (query.length < 2) {
    fromCitySuggestions.value = []
    return
  }

  if (citySearchTimeout) clearTimeout(citySearchTimeout)

  citySearchTimeout = setTimeout(async () => {
    try {
      fromCityLoading.value = true
      const cities = await cdekService.suggestCities(query)
      console.log('Получены города для "Откуда":', cities)
      fromCitySuggestions.value = cities.map((city) => ({
        value: city.code.toString(),
        label: city.full_name,
        data: city,
      }))
      console.log('Сформированные suggestions для "Откуда":', fromCitySuggestions.value)
    } catch (error) {
      console.error('Ошибка поиска города:', error)
    } finally {
      fromCityLoading.value = false
    }
  }, 500)
}

const searchToCity = async (query: string) => {
  if (query.length < 2) {
    toCitySuggestions.value = []
    return
  }

  if (citySearchTimeout) clearTimeout(citySearchTimeout)

  citySearchTimeout = setTimeout(async () => {
    try {
      toCityLoading.value = true
      const cities = await cdekService.suggestCities(query)
      console.log('Получены города для "Куда":', cities)
      toCitySuggestions.value = cities.map((city) => ({
        value: city.code.toString(),
        label: city.full_name,
        data: city,
      }))
      console.log('Сформированные suggestions для "Куда":', toCitySuggestions.value)
    } catch (error) {
      console.error('Ошибка поиска города:', error)
    } finally {
      toCityLoading.value = false
    }
  }, 500)
}

// Поиск адресов DaData
const searchFromAddress = async (query: string) => {
  if (query.length < 3) {
    fromAddressSuggestions.value = []
    return
  }

  if (addressSearchTimeout) clearTimeout(addressSearchTimeout)

  addressSearchTimeout = setTimeout(async () => {
    try {
      fromAddressLoading.value = true
      const response = await dadataService.suggestAddress(query)
      fromAddressSuggestions.value = response.suggestions.map((s: DadataSuggestion) => ({
        value: s.value,
        label: s.value,
        data: s.data,
      }))
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
    } finally {
      fromAddressLoading.value = false
    }
  }, 500) // Увеличено с 300 до 500ms
}

const searchToAddress = async (query: string) => {
  if (query.length < 3) {
    toAddressSuggestions.value = []
    return
  }

  if (addressSearchTimeout) clearTimeout(addressSearchTimeout)

  addressSearchTimeout = setTimeout(async () => {
    try {
      toAddressLoading.value = true
      const response = await dadataService.suggestAddress(query)
      toAddressSuggestions.value = response.suggestions.map((s: DadataSuggestion) => ({
        value: s.value,
        label: s.value,
        data: s.data,
      }))
    } catch (error) {
      console.error('Ошибка поиска адреса:', error)
    } finally {
      toAddressLoading.value = false
    }
  }, 500) // Увеличено с 300 до 500ms
}

// Поиск ФИО DaData
const searchCustomerName = async (query: string) => {
  if (query.length < 2) {
    customerNameSuggestions.value = []
    return
  }

  if (nameSearchTimeout) clearTimeout(nameSearchTimeout)

  nameSearchTimeout = setTimeout(async () => {
    try {
      customerNameLoading.value = true
      const response = await dadataService.suggestName(query)
      customerNameSuggestions.value = response.suggestions.map((s: DadataSuggestion) => ({
        value: s.value,
        label: s.value,
        data: s.data,
      }))
    } catch (error) {
      console.error('Ошибка поиска ФИО:', error)
    } finally {
      customerNameLoading.value = false
    }
  }, 500) // Увеличено с 300 до 500ms
}

const searchSellerName = async (query: string) => {
  if (query.length < 2) {
    sellerNameSuggestions.value = []
    return
  }

  if (nameSearchTimeout) clearTimeout(nameSearchTimeout)

  nameSearchTimeout = setTimeout(async () => {
    try {
      sellerNameLoading.value = true
      const response = await dadataService.suggestName(query)
      sellerNameSuggestions.value = response.suggestions.map((s: DadataSuggestion) => ({
        value: s.value,
        label: s.value,
        data: s.data,
      }))
    } catch (error) {
      console.error('Ошибка поиска ФИО:', error)
    } finally {
      sellerNameLoading.value = false
    }
  }, 500) // Увеличено с 300 до 500ms
}

// Обработчики выбора
const handleFromCitySelect = (suggestion: { value: string; label: string; data?: any }) => {
  console.log('🏙️ [FROM] Выбран город отправления:', suggestion)
  console.log('📊 [FROM] Полные данные suggestion.data:', suggestion.data)
  
  if (suggestion.data) {
    fromCitySelected.value = true
    fromCityCode.value = suggestion.data.code
    fromCityName.value = suggestion.data.city || suggestion.data.full_name.split(',')[0].trim()
    
    // Сохраняем координаты только если они есть
    if (suggestion.data.latitude !== undefined && suggestion.data.longitude !== undefined) {
      fromCityLatitude.value = suggestion.data.latitude
      fromCityLongitude.value = suggestion.data.longitude
      console.log('✅ [FROM] Координаты найдены и сохранены:', {
        latitude: fromCityLatitude.value,
        longitude: fromCityLongitude.value
      })
    } else {
      console.warn('⚠️ [FROM] Координаты отсутствуют в данных города!')
      fromCityLatitude.value = undefined
      fromCityLongitude.value = undefined
    }
    
    fromCountryCode.value = suggestion.data.country_code || 'RU'
    console.log('💾 [FROM] Сохранены данные города отправления:', {
      code: fromCityCode.value,
      city: fromCityName.value,
      latitude: fromCityLatitude.value,
      longitude: fromCityLongitude.value,
      country: fromCountryCode.value,
    })
    formErrors.fromCity = ''
    calculationAlert.value = null
    if (suggestion.data.postal_codes && suggestion.data.postal_codes.length > 0) {
      fromPostalCode.value = suggestion.data.postal_codes[0]
      formErrors.fromPostalCode = ''
    }
  }
}

const handleToCitySelect = (suggestion: { value: string; label: string; data?: any }) => {
  console.log('🏙️ [TO] Выбран город получения:', suggestion)
  console.log('📊 [TO] Полные данные suggestion.data:', suggestion.data)
  
  if (suggestion.data) {
    toCitySelected.value = true
    toCityCode.value = suggestion.data.code
    toCityName.value = suggestion.data.city || suggestion.data.full_name.split(',')[0].trim()
    
    // Сохраняем координаты только если они есть
    if (suggestion.data.latitude !== undefined && suggestion.data.longitude !== undefined) {
      toCityLatitude.value = suggestion.data.latitude
      toCityLongitude.value = suggestion.data.longitude
      console.log('✅ [TO] Координаты найдены и сохранены:', {
        latitude: toCityLatitude.value,
        longitude: toCityLongitude.value
      })
    } else {
      console.warn('⚠️ [TO] Координаты отсутствуют в данных города!')
      toCityLatitude.value = undefined
      toCityLongitude.value = undefined
    }
    
    toCountryCode.value = suggestion.data.country_code || 'RU'
    console.log('💾 [TO] Сохранены данные города получения:', {
      code: toCityCode.value,
      city: toCityName.value,
      latitude: toCityLatitude.value,
      longitude: toCityLongitude.value,
      country: toCountryCode.value,
    })
    formErrors.toCity = ''
    calculationAlert.value = null
    if (suggestion.data.postal_codes && suggestion.data.postal_codes.length > 0) {
      toPostalCode.value = suggestion.data.postal_codes[0]
      formErrors.toPostalCode = ''
    }
  }
}

const handleFromAddressSelect = (suggestion: { value: string; label: string; data?: any }) => {
  if (suggestion.data?.postal_code) {
    fromPostalCode.value = suggestion.data.postal_code
    formErrors.fromPostalCode = ''
    calculationAlert.value = null
  }
}

const handleToAddressSelect = (suggestion: { value: string; label: string; data?: any }) => {
  if (suggestion.data?.postal_code) {
    toPostalCode.value = suggestion.data.postal_code
    formErrors.toPostalCode = ''
    calculationAlert.value = null
  }
}

// Функции для работы с картой
const openMapForAddress = (context: 'from' | 'to') => {
  const citySelected = context === 'from' ? fromCitySelected.value : toCitySelected.value
  const cityName = context === 'from' ? fromCityName.value : toCityName.value
  const cityLat = context === 'from' ? fromCityLatitude.value : toCityLatitude.value
  const cityLon = context === 'from' ? fromCityLongitude.value : toCityLongitude.value
  
  console.log('🗺️ [CreateOrderView] ========== ОТКРЫТИЕ КАРТЫ ==========')
  console.log('📍 [CreateOrderView] Контекст:', context)
  console.log('✅ [CreateOrderView] Город выбран:', citySelected)
  console.log('🏙️ [CreateOrderView] Название города:', cityName)
  console.log('📍 [CreateOrderView] Широта:', cityLat, 'Тип:', typeof cityLat)
  console.log('📍 [CreateOrderView] Долгота:', cityLon, 'Тип:', typeof cityLon)
  console.log('📊 [CreateOrderView] Все данные from:', {
    fromCityName: fromCityName.value,
    fromCityLatitude: fromCityLatitude.value,
    fromCityLongitude: fromCityLongitude.value,
    fromCitySelected: fromCitySelected.value
  })
  console.log('📊 [CreateOrderView] Все данные to:', {
    toCityName: toCityName.value,
    toCityLatitude: toCityLatitude.value,
    toCityLongitude: toCityLongitude.value,
    toCitySelected: toCitySelected.value
  })
  
  if (!citySelected || !cityName) {
    alert('Сначала выберите город из списка или карта откроется с центром в Москве')
  }
  
  mapContext.value = context
  mapDeliveryPoints.value = []
  isMapModalOpen.value = true
  
  console.log('✅ [CreateOrderView] Модальное окно открыто, mapContext:', mapContext.value)
}

const handlePointsUpdate = (points: any[]) => {
  mapDeliveryPoints.value = points
  console.log('Обновлен список точек:', points.length)
}

const filteredMapPoints = computed(() => {
  if (!mapSearchQuery.value.trim()) {
    return mapDeliveryPoints.value
  }
  const query = mapSearchQuery.value.toLowerCase()
  return mapDeliveryPoints.value.filter(point => 
    point.address?.toLowerCase().includes(query) ||
    point.addressFull?.toLowerCase().includes(query) ||
    point.code?.toLowerCase().includes(query)
  )
})

const handlePointSelect = async (point: any) => {
  console.log('Выбран пункт выдачи:', point)
  
  if (mapContext.value === 'from') {
    // Заполняем код ПВЗ
    shipmentPoint.value = point.code
    
    // Заполняем адрес (без города)
    fromAddress.value = point.address || point.addressFull
    formErrors.fromAddress = ''
    
    // Заполняем индекс из данных пункта выдачи (приоритетно)
    if (point.postalCode) {
      fromPostalCode.value = point.postalCode
      formErrors.fromPostalCode = ''
      console.log('✅ Установлен индекс из ПВЗ:', point.postalCode)
    }
    
    // Заполняем город
    if (point.city) {
      fromCity.value = point.city
      fromCityName.value = point.city
      fromCitySelected.value = true
      formErrors.fromCity = ''
      
      // Сохраняем координаты точки как координаты города (приближение)
      if (point.latitude !== undefined && point.longitude !== undefined) {
        fromCityLatitude.value = point.latitude
        fromCityLongitude.value = point.longitude
        console.log('Установлены координаты из точки:', point.latitude, point.longitude)
      }
      
      // Пытаемся получить полную информацию о городе из CDEK API
      try {
        const cities = await cdekService.suggestCities(point.city)
        console.log('Результат suggestCities:', cities)
        if (cities && cities.length > 0) {
          const cityData = cities[0]
          fromCityCode.value = cityData.code
          fromCountryCode.value = cityData.country_code || 'RU'
          
          // Обновляем координаты из API только если они есть и отличаются
          if (cityData.latitude !== undefined && cityData.longitude !== undefined) {
            fromCityLatitude.value = cityData.latitude
            fromCityLongitude.value = cityData.longitude
            console.log('Обновлены координаты из API города:', cityData.latitude, cityData.longitude)
          }
          
          // Если индекс не был заполнен из ПВЗ, берем из города
          if (!fromPostalCode.value && cityData.postal_codes && cityData.postal_codes.length > 0) {
            fromPostalCode.value = cityData.postal_codes[0]
            formErrors.fromPostalCode = ''
            console.log('✅ Установлен индекс из API города:', fromPostalCode.value)
          }
          console.log('Установлен код города отправления:', fromCityCode.value)
        }
      } catch (err: any) {
        console.warn('Не удалось получить данные города:', err)
      }
    }
  } else {
    // Заполняем код ПВЗ
    deliveryPoint.value = point.code
    
    // Заполняем адрес (без города)
    toAddress.value = point.address || point.addressFull
    formErrors.toAddress = ''
    
    // Заполняем индекс из данных пункта выдачи (приоритетно)
    if (point.postalCode) {
      toPostalCode.value = point.postalCode
      formErrors.toPostalCode = ''
      console.log('✅ Установлен индекс из ПВЗ:', point.postalCode)
    }
    
    // Заполняем город
    if (point.city) {
      toCity.value = point.city
      toCityName.value = point.city
      toCitySelected.value = true
      formErrors.toCity = ''
      
      // Сохраняем координаты точки как координаты города (приближение)
      if (point.latitude !== undefined && point.longitude !== undefined) {
        toCityLatitude.value = point.latitude
        toCityLongitude.value = point.longitude
        console.log('Установлены координаты из точки:', point.latitude, point.longitude)
      }
      
      // Пытаемся получить полную информацию о городе из CDEK API
      try {
        const cities = await cdekService.suggestCities(point.city)
        console.log('Результат suggestCities:', cities)
        if (cities && cities.length > 0) {
          const cityData = cities[0]
          toCityCode.value = cityData.code
          toCountryCode.value = cityData.country_code || 'RU'
          
          // Обновляем координаты из API только если они есть и отличаются
          if (cityData.latitude !== undefined && cityData.longitude !== undefined) {
            toCityLatitude.value = cityData.latitude
            toCityLongitude.value = cityData.longitude
            console.log('Обновлены координаты из API города:', cityData.latitude, cityData.longitude)
          }
          
          // Если индекс не был заполнен из ПВЗ, берем из города
          if (!toPostalCode.value && cityData.postal_codes && cityData.postal_codes.length > 0) {
            toPostalCode.value = cityData.postal_codes[0]
            formErrors.toPostalCode = ''
            console.log('✅ Установлен индекс из API города:', toPostalCode.value)
          }
          console.log('Установлен код города получения:', toCityCode.value)
        }
      } catch (err: any) {
        console.warn('Не удалось получить данные города:', err)
      }
    }
  }
  
  isMapModalOpen.value = false
}

// Watchers для автозаполнения
watch(fromCity, (value) => {
  formErrors.fromCity = ''
  calculationAlert.value = null
  resetOrderError()
  if (fromCitySelected.value) {
    fromCitySelected.value = false
    return
  }
  if (!value) {
    fromCityCode.value = null
    fromCityName.value = ''
    fromCountryCode.value = 'RU'
    fromPostalCode.value = ''
    fromCitySuggestions.value = []
    return
  }
  fromCityCode.value = null
  fromCityName.value = ''
  fromCountryCode.value = 'RU'
  fromPostalCode.value = ''
  searchFromCity(value)
})

watch(toCity, (value) => {
  formErrors.toCity = ''
  calculationAlert.value = null
  resetOrderError()
  if (toCitySelected.value) {
    toCitySelected.value = false
    return
  }
  if (!value) {
    toCityCode.value = null
    toCityName.value = ''
    toCountryCode.value = 'RU'
    toPostalCode.value = ''
    toCitySuggestions.value = []
    return
  }
  toCityCode.value = null
  toCityName.value = ''
  toCountryCode.value = 'RU'
  toPostalCode.value = ''
  searchToCity(value)
})

watch(fromAddress, (value) => {
  if (value) searchFromAddress(value)
})

watch(toAddress, (value) => {
  if (value) searchToAddress(value)
})

watch(customerName, (value) => {
  resetOrderError()
  if (value) searchCustomerName(value)
})

watch(sellerName, (value) => {
  if (value) searchSellerName(value)
})

watch(fromPostalCode, () => {
  formErrors.fromPostalCode = ''
  calculationAlert.value = null
})

watch(toPostalCode, () => {
  formErrors.toPostalCode = ''
  calculationAlert.value = null
})

watch(estimatedCost, () => {
  if (selectedTariffCode.value === null) return
  const selected = tariffResults.value.find(
    (tariff) => tariff.tariff_code === selectedTariffCode.value,
  )
  if (selected) {
    updateTotals(selected.delivery_sum)
  }
})

watch([tradingCompany, deliveryMethod, customerPhone], () => {
  resetOrderError()
})

watch([fromCityName, toCityName], () => {
  resetOrderError()
})

// При изменении способа доставки очищаем результаты расчета
watch(deliveryMethod, (newMethod, oldMethod) => {
  if (oldMethod !== null && newMethod !== oldMethod && tariffResults.value.length > 0) {
    console.log(`🔄 Способ доставки изменен с "${oldMethod}" на "${newMethod}", требуется пересчет тарифов`)
    clearCalculationResults()
    calculationAlert.value = {
      type: 'error',
      message: 'Способ доставки изменен. Пожалуйста, пересчитайте стоимость.',
    }
  }
})

// Добавить посылку
const addPackage = () => {
  packages.value.push(createEmptyPackage())
  packageErrors.value.push(createEmptyPackageErrors())
}

// Удалить посылку
const removePackage = (index: number) => {
  if (packages.value.length > 1) {
    packages.value.splice(index, 1)
    packageErrors.value.splice(index, 1)
  }
}

const formatDateForCdek = (date: Date) => {
  const pad = (value: number) => value.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? '+' : '-'
  const offsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60))
  const offsetRest = pad(Math.abs(offsetMinutes) % 60)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}${offsetRest}`
}

// Расчёт стоимости
const calculateCost = async () => {
  calculationAlert.value = null
  orderAlert.value = null
  resetFieldErrors()

  const normalizedFromCity = fromCityName.value.trim()
  const normalizedToCity = toCityName.value.trim()
  const normalizedFromPostal = fromPostalCode.value.trim()
  const normalizedToPostal = toPostalCode.value.trim()
  const postalPattern = /^[0-9]{6}$/

  let hasError = false

  if (!normalizedFromCity) {
    formErrors.fromCity = 'Выберите город отправления из подсказок'
    hasError = true
  }

  if (!normalizedToCity) {
    formErrors.toCity = 'Выберите город получения из подсказок'
    hasError = true
  }

  if (!postalPattern.test(normalizedFromPostal)) {
    formErrors.fromPostalCode = 'Введите корректный индекс (6 цифр)'
    hasError = true
  }

  if (!postalPattern.test(normalizedToPostal)) {
    formErrors.toPostalCode = 'Введите корректный индекс (6 цифр)'
    hasError = true
  }

  packages.value.forEach((pkg, index) => {
    const errors = packageErrors.value[index]

    packageFieldKeys.forEach((field) => {
      errors[field] = ''
      const rawValue = pkg[field].trim()

      if (!rawValue) {
        errors[field] = `Укажите значение для поля «${packageFieldLabels[field]}»`
        hasError = true
        return
      }

      const numericValue = Number(rawValue)
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        errors[field] = 'Введите положительное число'
        hasError = true
      }
    })
  })

  const validPackages = packages.value.filter((_, index) =>
    Object.values(packageErrors.value[index]).every((message) => !message),
  )

  if (validPackages.length === 0) {
    hasError = true
  }

  if (hasError) {
    calculationAlert.value = {
      type: 'error',
      message: 'Пожалуйста, исправьте выделенные поля и повторите попытку.',
    }
    clearCalculationResults()
    return
  }

  const packageItems: PackageItem[] = validPackages.map((p) => ({
    weight: Math.round(Number(p.weight)),
    length: Math.round(Number(p.length)),
    width: Math.round(Number(p.width)),
    height: Math.round(Number(p.height)),
  }))

  // Формируем дату в формате, который понимает CDEK (без миллисекунд, с оффсетом)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateISO = formatDateForCdek(tomorrow)

  const fromLocationPayload = {
    code: fromCityCode.value || undefined,
    country_code: fromCountryCode.value || undefined,
    city: normalizedFromCity,
    postal_code: normalizedFromPostal,
    address: fromAddress.value || undefined,
  }

  const toLocationPayload = {
    code: toCityCode.value || undefined,
    country_code: toCountryCode.value || undefined,
    city: normalizedToCity,
    postal_code: normalizedToPostal,
    address: toAddress.value || undefined,
  }

  const requestData = {
    date: dateISO,
    type: 1,
    currency: 643,
    lang: 'rus',
    from_location: Object.fromEntries(
      Object.entries(fromLocationPayload).filter(
        ([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '',
      ),
    ),
    to_location: Object.fromEntries(
      Object.entries(toLocationPayload).filter(
        ([, value]) => value !== undefined && value !== null && `${value}`.trim() !== '',
      ),
    ),
    packages: packageItems,
  }

  try {
    const allTariffs = await cdekService.calculateTariff(requestData)
    
    // Фильтруем тарифы в соответствии с выбранным способом доставки
    const filteredTariffs = allTariffs.filter(tariff => 
      isTariffSuitableForDeliveryMethod(tariff, deliveryMethod.value!)
    )
    
    tariffResults.value = filteredTariffs

    console.log(`📦 Всего тарифов от CDEK: ${allTariffs.length}, подходящих для "${deliveryMethod.value}": ${filteredTariffs.length}`)

    if (!filteredTariffs.length) {
      clearCalculationResults()
      calculationAlert.value = {
        type: 'error',
        message: `Не удалось подобрать тарифы для доставки "${deliveryMethod.value === 'door' ? 'до двери' : 'до ПВЗ'}". Попробуйте изменить параметры.`,
      }
      return
    }

    const firstTariff = filteredTariffs[0]
    selectedTariffCode.value = firstTariff.tariff_code
    updateTotals(firstTariff.delivery_sum)
    calculationAlert.value = {
      type: 'success',
      message: `Найдено тарифов: ${filteredTariffs.length}`,
    }
  } catch (error: any) {
    console.error('Ошибка расчёта:', error)
    clearCalculationResults()
    calculationAlert.value = {
      type: 'error',
      message: error?.response?.data?.message || error.message || 'Не удалось рассчитать стоимость',
    }
  }
}

// Валидация номера телефона
const formatPhone = (value: string) => {
  return value.replace(/\D/g, '').slice(0, 11)
}

watch(customerPhone, (value) => {
  customerPhone.value = formatPhone(value)
})

watch(sellerPhone, (value) => {
  sellerPhone.value = formatPhone(value)
})

// Отслеживание изменений координат городов для отладки
watch([fromCityLatitude, fromCityLongitude, fromCityName], ([lat, lon, name]) => {
  console.log('🔍 [CreateOrderView:WATCH] FROM city данные изменились:', {
    name,
    latitude: lat,
    longitude: lon,
    types: {
      lat: typeof lat,
      lon: typeof lon
    }
  })
})

watch([toCityLatitude, toCityLongitude, toCityName], ([lat, lon, name]) => {
  console.log('🔍 [CreateOrderView:WATCH] TO city данные изменились:', {
    name,
    latitude: lat,
    longitude: lon,
    types: {
      lat: typeof lat,
      lon: typeof lon
    }
  })
})

// Создание заказа
const createOrder = async () => {
  orderAlert.value = null

  const validationMessages: string[] = []
  tradingCompany.value = 'Тест компания'
  if (!tradingCompany.value) validationMessages.push('Выберите торговую компанию.')
  if (!deliveryMethod.value) validationMessages.push('Укажите способ доставки.')
  if (!fromCityName.value || !toCityName.value) {
    validationMessages.push('Заполните города отправления и получения.')
  }
  
  // Валидация адреса/ПВЗ в зависимости от способа доставки
  if (deliveryMethod.value === 'door') {
    // До двери - нужен адрес получателя
    if (!toAddress.value) {
      validationMessages.push('Для доставки до двери укажите адрес получателя.')
    }
  } else if (deliveryMethod.value === 'pvz') {
    // До ПВЗ - нужен код ПВЗ получения
    if (!deliveryPoint.value) {
      validationMessages.push('Для доставки до ПВЗ выберите пункт выдачи на карте.')
    }
  }
  
  if (!customerName.value || !customerPhone.value) {
    validationMessages.push('Заполните данные заказчика.')
  }
  if (!selectedTariffCode.value || !tariffResults.value.length) {
    validationMessages.push('Сначала рассчитайте стоимость и выберите тариф.')
  }

  if (validationMessages.length) {
    orderAlert.value = {
      type: 'error',
      message: validationMessages.join(' '),
    }
    return
  }

  try {
    // Получаем выбранный тариф
    const selectedTariff = tariffResults.value.find(
      (t) => t.tariff_code === selectedTariffCode.value,
    )
    const deliveryMode = getDeliveryModeFromTariff(selectedTariff)

    // Формируем данные заказа согласно CDEK API
    const orderData: any = {
      type: 1, // 1 - интернет-магазин, 2 - доставка
      number: `ORDER-${Date.now()}`,
      tariff_code: selectedTariffCode.value,
      comment: `Заказ через ${tradingCompany.value}`,

      // Получатель (обязательно)
      recipient: {
        name: customerName.value,
        phones: [
          {
            number: customerPhone.value.startsWith('+')
              ? customerPhone.value
              : `+${customerPhone.value}`,
          },
        ],
      },

      // Упаковки с товарами
      packages: packages.value
        .filter((p) => p.weight && p.length && p.width && p.height)
        .map((p, index) => ({
          number: `${index + 1}`,
          weight: parseInt(p.weight, 10),
          length: parseInt(p.length, 10),
          width: parseInt(p.width, 10),
          height: parseInt(p.height, 10),
          comment: '-', // Обязательное непустое значение
          payment: payer.value === 'receiver' ? 1 : 0, // 1 = получатель, 0 = отправитель
          items: [
            {
              name: 'Товар',
              ware_key: `ITEM-${index + 1}`,
              payment: { value: parseFloat(estimatedCost.value || '0') },
              cost: parseFloat(estimatedCost.value || '0'),
              weight: parseInt(p.weight, 10),
              amount: 1,
            },
          ],
        })),
    }

    // Отправитель (если есть данные продавца)
    if (sellerName.value && sellerPhone.value) {
      orderData.sender = {
        name: sellerName.value,
        phones: [
          {
            number: sellerPhone.value.startsWith('+') ? sellerPhone.value : `+${sellerPhone.value}`,
          },
        ],
      }
    }

    // Наложенный платеж: если получатель платит, добавляем сумму
    if (payer.value === 'receiver') {
      const totalAmount = parseFloat(totalCost.value || deliveryCost.value || '0')
      if (totalAmount > 0) {
        orderData.delivery_recipient_cost = {
          value: totalAmount
        }
      }
    }

    // Обработка адресов в зависимости от режима доставки

    // ОТ СКЛАДА: используем shipment_point
    if (needsShipmentPoint(deliveryMode)) {
      if (shipmentPoint.value) {
        orderData.shipment_point = shipmentPoint.value
      } else {
        orderAlert.value = {
          type: 'error',
          message: 'Для выбранного тарифа необходимо указать код ПВЗ отправки',
        }
        return
      }
    }
    // ОТ ДВЕРИ: используем from_location
    else if (needsFromLocation(deliveryMode)) {
      orderData.from_location = {
        code: fromCityCode.value ?? undefined,
        country_code: fromCountryCode.value,
        city: fromCityName.value,
        address: fromAddress.value || undefined,
        postal_code: fromPostalCode.value || undefined,
      }
    }

    // ДО СКЛАДА/ПОСТАМАТА: используем delivery_point
    if (needsDeliveryPoint(deliveryMode)) {
      if (deliveryPoint.value) {
        orderData.delivery_point = deliveryPoint.value
      } else {
        orderAlert.value = {
          type: 'error',
          message: 'Для выбранного тарифа необходимо указать код ПВЗ получения',
        }
        return
      }
    }
    // ДО ДВЕРИ: используем to_location
    else if (needsToLocation(deliveryMode)) {
      orderData.to_location = {
        code: toCityCode.value ?? undefined,
        country_code: toCountryCode.value,
        city: toCityName.value,
        address: toAddress.value || undefined,
        postal_code: toPostalCode.value || undefined,
      }
    }

    console.log('📦 Отправка заказа в CDEK:', JSON.stringify(orderData, null, 2))

    const result = await cdekService.createOrder(orderData)

    console.log('✅ Результат создания заказа:', result)

    // Формируем сообщение об успехе
    const successParts = ['Заказ успешно создан!']
    if (result.entity?.uuid) successParts.push(`UUID: ${result.entity.uuid}`)
    if (result.local?.cdekNumber) successParts.push(`Номер CDEK: ${result.local.cdekNumber}`)

    orderAlert.value = {
      type: 'success',
      message: successParts.join(' '),
    }
  } catch (error: any) {
    console.error('❌ Ошибка при создании заказа:', error)
    const errorMessage = error.response?.data?.error || error.message || 'Неизвестная ошибка'
    const errorDetails = error.response?.data?.requests?.[0]?.errors || []

    let fullMessage = `Не удалось создать заказ: ${errorMessage}`
    if (errorDetails.length > 0) {
      fullMessage += `. Детали: ${errorDetails.map((e: any) => e.message).join(', ')}`
    }

    orderAlert.value = {
      type: 'error',
      message: fullMessage,
    }
  }
}

const resetForm = () => {
  tradingCompany.value = null
  deliveryMethod.value = 'door' // Сброс на дефолтное значение
  payer.value = 'sender' // Сброс на дефолтное значение
  fromCity.value = ''
  fromCityCode.value = null
  fromCityName.value = ''
  fromCountryCode.value = 'RU'
  fromCitySelected.value = false
  fromAddress.value = ''
  fromFlat.value = ''
  fromPostalCode.value = ''
  shipmentPoint.value = ''
  toCity.value = ''
  toCityCode.value = null
  toCityName.value = ''
  toCountryCode.value = 'RU'
  toCitySelected.value = false
  toAddress.value = ''
  toFlat.value = ''
  toPostalCode.value = ''
  deliveryPoint.value = ''
  customerName.value = ''
  customerPhone.value = ''
  sellerName.value = ''
  sellerPhone.value = ''
  packages.value = [createEmptyPackage()]
  packageErrors.value = [createEmptyPackageErrors()]
  estimatedCost.value = ''
  deliveryCost.value = ''
  markup.value = ''
  totalCost.value = ''
  formErrors.fromCity = ''
  formErrors.toCity = ''
  formErrors.fromPostalCode = ''
  formErrors.toPostalCode = ''
  calculationAlert.value = null
  clearCalculationResults()
}
</script>

<template>
  <main class="main-container">
    <div class="toMain-btn-container">
      <button class="toMain-btn" @click="toMain()">← Главная</button>
    </div>
    <h1>Оформить заказ</h1>
    <section class="dropdawn-section">
      <Dropdown
        v-model="deliveryMethod"
        :options="deliveryMethodOptions"
        placeholder="Способ доставки"
        width="1260px"
        height="54px"
      />
    </section>

    <!-- Адрес ОТКУДА -->
    <section class="address-section">
      <h4 class="section-title">Откуда</h4>
      <div class="common-address">
        <section class="required-address-section">
          <div class="required-address-inputs">
            <Autocomplete
              v-model="fromCity"
              :suggestions="fromCitySuggestions"
              :loading="fromCityLoading"
              placeholder="Город отправления"
              width="413px"
              height="54px"
              :error="formErrors.fromCity"
              @select="handleFromCitySelect"
            />
            <Autocomplete
              v-model="fromAddress"
              :suggestions="fromAddressSuggestions"
              :loading="fromAddressLoading"
              placeholder="Адрес отправления"
              width="413px"
              height="54px"
              @select="handleFromAddressSelect"
            />
          </div>
          <div class="map">
            <p @click="openMapForAddress('from')">Указать на карте</p>
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.1438 8.22777C15.1438 11.842 11.1343 15.6061 9.78793 16.7686C9.6625 16.8629 9.50982 16.9139 9.35289 16.9139C9.19596 16.9139 9.04328 16.8629 8.91785 16.7686C7.57147 15.6061 3.56201 11.842 3.56201 8.22777C3.56201 6.69193 4.17212 5.219 5.25812 4.133C6.34412 3.047 7.81705 2.43689 9.35289 2.43689C10.8887 2.43689 12.3617 3.047 13.4477 4.133C14.5337 5.219 15.1438 6.69193 15.1438 8.22777Z"
                stroke="#344E41"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9.35273 10.3993C10.5521 10.3993 11.5243 9.42706 11.5243 8.22773C11.5243 7.0284 10.5521 6.05615 9.35273 6.05615C8.1534 6.05615 7.18115 7.0284 7.18115 8.22773C7.18115 9.42706 8.1534 10.3993 9.35273 10.3993Z"
                stroke="#344E41"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </section>

        <div v-if="isMapModalOpen" class="modal-overlay" @click.self="isMapModalOpen = false">
          <div class="modal-window">
            <div class="ymap-container">
              <YMap
                :city-name="mapContext === 'from' ? fromCityName : toCityName"
                :city-latitude="mapContext === 'from' ? fromCityLatitude : toCityLatitude"
                :city-longitude="mapContext === 'from' ? fromCityLongitude : toCityLongitude"
                @select-point="handlePointSelect"
                @update-points="handlePointsUpdate"
              />
            </div>
            <div class="left-side-container">
              <div class="close-btn-container">
                <button class="close-btn" @click="isMapModalOpen = false">×</button>
              </div>
              <div class="list">
                <div v-if="mapDeliveryPoints.length === 0" style="padding: 20px; color: #666; text-align: center;">
                  <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600;">
                    {{ (mapContext === 'from' ? fromCityName : toCityName) || 'Город не выбран' }}
                  </p>
                  <p style="margin: 0; font-size: 14px;">
                    {{ mapContext === 'from' ? 'Переместите карту для загрузки пунктов отправки' : 'Переместите карту для загрузки пунктов получения' }}
                  </p>
                </div>
                <div v-else style="display: flex; flex-direction: column; height: 100%;">
                  <div style="padding: 12px; border-bottom: 1px solid #eee;">
                    <Input 
                      v-model="mapSearchQuery" 
                      height="44px" 
                      width="100%" 
                      placeholder="Поиск по адресу или коду" 
                    />
                    <p style="margin: 8px 0 0; font-size: 12px; color: #999;">
                      Найдено: {{ filteredMapPoints.length }} из {{ mapDeliveryPoints.length }}
                    </p>
                  </div>
                  <div style="overflow-y: auto; flex: 1; padding: 8px;">
                    <div v-if="filteredMapPoints.length === 0" style="padding: 20px; color: #666; text-align: center;">
                      Ничего не найдено
                    </div>
                    <PVZCard
                      v-for="point in filteredMapPoints"
                      :key="point.code"
                      :PVZName="point.type === 'POSTAMAT' ? 'Постамат' : 'ПВЗ'"
                      :address="point.addressFull || point.address"
                      :code="point.code"
                      @click="handlePointSelect(point)"
                      style="cursor: pointer; margin-bottom: 8px;"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="extra-address-section">
          <Input
            v-model="fromPostalCode"
            height="54px"
            width="413px"
            placeholder="Индекс"
            :error="formErrors.fromPostalCode"
          />
          <!-- Поле скрыто, но остается в логике для автозаполнения через карту -->
          <Input
            v-if="false"
            v-model="shipmentPoint"
            height="54px"
            width="338px"
            placeholder="Код ПВЗ отправки (если со склада)"
          />
        </section>
      </div>
    </section>

    <!-- Адрес КУДА -->
    <section class="address-section">
      <h4 class="section-title">Куда</h4>
      <div class="common-address">
        <section class="required-address-section">
          <div class="required-address-inputs">
            <Autocomplete
              v-model="toCity"
              :suggestions="toCitySuggestions"
              :loading="toCityLoading"
              placeholder="Город получателя"
              width="413px"
              height="54px"
              :error="formErrors.toCity"
              @select="handleToCitySelect"
            />
            <Autocomplete
              v-model="toAddress"
              :suggestions="toAddressSuggestions"
              :loading="toAddressLoading"
              placeholder="Адрес получателя"
              width="413px"
              height="54px"
              @select="handleToAddressSelect"
            />
          </div>
          <div class="map">
            <p @click="openMapForAddress('to')">Указать на карте</p>
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.1438 8.22777C15.1438 11.842 11.1343 15.6061 9.78793 16.7686C9.6625 16.8629 9.50982 16.9139 9.35289 16.9139C9.19596 16.9139 9.04328 16.8629 8.91785 16.7686C7.57147 15.6061 3.56201 11.842 3.56201 8.22777C3.56201 6.69193 4.17212 5.219 5.25812 4.133C6.34412 3.047 7.81705 2.43689 9.35289 2.43689C10.8887 2.43689 12.3617 3.047 13.4477 4.133C14.5337 5.219 15.1438 6.69193 15.1438 8.22777Z"
                stroke="#344E41"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9.35273 10.3993C10.5521 10.3993 11.5243 9.42706 11.5243 8.22773C11.5243 7.0284 10.5521 6.05615 9.35273 6.05615C8.1534 6.05615 7.18115 7.0284 7.18115 8.22773C7.18115 9.42706 8.1534 10.3993 9.35273 10.3993Z"
                stroke="#344E41"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </section>
        <section class="extra-address-section">
          <Input
            v-model="toPostalCode"
            height="54px"
            width="413px"
            placeholder="Индекс"
            :error="formErrors.toPostalCode"
          />
          <!-- Поле скрыто, но остается в логике для автозаполнения через карту -->
          <Input
            v-if="false"
            v-model="deliveryPoint"
            height="54px"
            width="338px"
            placeholder="Код ПВЗ получения (если на склад/постамат)"
          />
        </section>
      </div>
    </section>

    <section class="customer-seller-section">
      <section class="customer-section">
        <h4 class="customer-seller-h4">Данные отправителя</h4>
        <Autocomplete
          v-model="customerName"
          :suggestions="customerNameSuggestions"
          :loading="customerNameLoading"
          placeholder="ФИО"
          width="625px"
          height="54px"
        />
        <Input
          v-model="customerPhone"
          height="54px"
          width="625px"
          placeholder="Телефон"
          type="tel"
        />
      </section>
      <section class="seller-section">
        <h4 class="customer-seller-h4">Данные получателя</h4>
        <Autocomplete
          v-model="sellerName"
          :suggestions="sellerNameSuggestions"
          :loading="sellerNameLoading"
          placeholder="ФИО"
          width="625px"
          height="54px"
        />
        <Input v-model="sellerPhone" height="54px" width="625px" placeholder="Телефон" type="tel" />
      </section>
    </section>
    <section class="packages-section">
      <h4 class="package-title">Посылка(-и)</h4>
      <div class="packages-container">
        <div class="packages">
          <div
            v-for="(pkg, index) in packages"
            :key="index"
            class="package"
            :style="{
              marginBottom:
                packageErrors[index] &&
                (packageErrors[index].weight ||
                  packageErrors[index].length ||
                  packageErrors[index].width ||
                  packageErrors[index].height)
                  ? '40px'
                  : '10px',
            }"
          >
            <Input
              v-model="pkg.weight"
              height="54px"
              width="217px"
              placeholder="Вес(гр)"
              :error="packageErrors[index]?.weight"
              @update:modelValue="() => clearPackageError(0, 'weight')"
            />
            <Input
              v-model="pkg.length"
              height="54px"
              width="217px"
              placeholder="Длина(см)"
              :error="packageErrors[index]?.length"
              @update:modelValue="() => clearPackageError(0, 'length')"
            />
            <Input
              v-model="pkg.width"
              height="54px"
              width="217px"
              placeholder="Ширина(см)"
              :error="packageErrors[index]?.width"
              @update:modelValue="() => clearPackageError(0, 'width')"
            />
            <Input
              v-model="pkg.height"
              height="54px"
              width="217px"
              placeholder="Высота(см)"
              :error="packageErrors[index]?.height"
              @update:modelValue="() => clearPackageError(0, 'height')"
            />
            <div v-if="index === 0" class="patch"></div>
            <!-- Кнопка удаления пакета -->
            <button v-if="index > 0" class="remove-btn" @click="removePackage(index)">
              <!-- <svg
              width="39"
              height="25"
              viewBox="0 0 39 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="12" y1="11.5" x2="27" y2="11.5" stroke="white" />
            </svg> -->
              Удалить посылку
            </button>
          </div>
        </div>
        <div class="plus-btn-container">
          <button class="plus-btn" @click="addPackage">
            <!-- <svg
            width="39"
            height="25"
            viewBox="0 0 39 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="12" y1="11.5" x2="27" y2="11.5" stroke="white" />
            <line x1="19.5" y1="4" x2="19.5" y2="19" stroke="white" />
          </svg> -->
            Добавить посылку
          </button>
        </div>
      </div>
    </section>
    <section class="proccesing-section">
      <section class="first-proccesing-section">
        <Input
          v-model="estimatedCost"
          height="54px"
          width="308px"
          placeholder="Оценочная стоимость"
          disabled
        />
        <button class="submit-proccessing-btn" @click="calculateCost">Рассчитать</button>
      </section>
      <section class="second-proccesing-section">
        <Input v-model="estimatedCost" height="54px" width="415px" placeholder="Сумма" disabled />
        <Input v-model="deliveryCost" height="54px" width="415px" placeholder="Доставка" disabled />
        <Input v-model="markup" height="54px" width="415px" placeholder="Наценка" disabled />
      </section>
    </section>

    <section v-if="calculationAlert" class="status-section">
      <div :class="['status-banner', calculationAlert.type]">
        {{ calculationAlert.message }}
      </div>
    </section>

    <section v-if="tariffResults.length" class="tariff-results-section">
      <h4>Предложенные тарифы</h4>
      <div class="tariff-cards">
        <article
          v-for="tariff in tariffResults"
          :key="tariff.tariff_code"
          :class="['tariff-card', { active: tariff.tariff_code === selectedTariffCode }]"
          @click="selectTariff(tariff)"
        >
          <header class="tariff-card__header">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span class="tariff-card__name">{{ tariff.tariff_name }}</span>
              <span v-if="tariff.category" class="tariff-card__category">{{ tariff.category }}</span>
            </div>
            <span class="tariff-card__price">{{ formatCurrency(tariff.delivery_sum) }}</span>
          </header>
          <p v-if="tariff.tariff_description" class="tariff-card__description">
            {{ tariff.tariff_description }}
          </p>
          <div class="tariff-card__meta">
            <span>Код: {{ tariff.tariff_code }}</span>
            <span>Срок: {{ getPeriodLabel(tariff) }}</span>
            <span v-if="getDeliveryDateLabel(tariff.delivery_date_range)">
              Доставка: {{ getDeliveryDateLabel(tariff.delivery_date_range) }}
            </span>
          </div>
          <button type="button" class="tariff-card__select" @click.stop="selectTariff(tariff)">
            {{ tariff.tariff_code === selectedTariffCode ? 'Выбран' : 'Выбрать' }}
          </button>
        </article>
      </div>
    </section>

    <section class="confirmation-section">
      <Input v-model="totalCost" height="54px" width="308px" placeholder="Итого" disabled />
      <Dropdown
        v-model="payer"
        :options="payerOptions"
        placeholder="Оплачивает"
        width="308px"
        height="54px"
      />
      <button class="submit-confirmation-btn" @click="createOrder">Сделать заказ</button>
    </section>

    <section v-if="orderAlert" class="status-section">
      <div :class="['status-banner', orderAlert.type]">
        {{ orderAlert.message }}
      </div>
    </section>
  </main>
</template>

<style scoped>
.main-container {
  padding: 50px 20px 100px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100dvw;
  height: fit-content;
}

.toMain-btn-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 20px;
}

.toMain-btn {
  position: absolute;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropdawn-section {
  margin-top: 40px;
  display: flex;
  gap: 10px;
}

.address-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.common-address {
  display: flex;
  gap: 10px;
}

.required-address-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.required-address-inputs {
  display: flex;
  gap: 10px;
}

.map {
  display: flex;
  align-items: flex-end;
  justify-content: end;

  p {
    display: flex;
    font-size: 12px;
    cursor: pointer;
  }

  svg {
    display: flex;
  }
}

.modal-overlay {
  position: fixed;
  top: 82px;
  left: 0;
  width: 100dvw;
  height: calc(100dvh - 82px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  overflow: scroll;
  padding: 20px;
}

.modal-window {
  background: #fff;
  border-radius: 16px;
  padding: 10px;
  width: 90dvw;
  height: 80dvh;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  display: flex;
}

.ymap-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 75dvw;
  height: 100%;
  border-radius: 15px;
  overflow: hidden;
}

.left-side-container {
  display: flex;
  flex-direction: column;
  width: 25dvw;
  height: 100%;
}

.close-btn-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 30px;
}

.close-btn {
  position: absolute;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.list {
  display: flex;
  flex-direction: column;
  width: 25dvw;
  height: 100%;
  padding: 10px;
  gap: 10px;
}

.extra-address-section {
  display: flex;
  gap: 10px;
}

.customer-seller-section {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.customer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seller-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.customer-seller-h4 {
  margin-left: 30px;
}

.packages-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.packages-container {
  display: flex;
}

.package-title {
  margin-left: 30px;
}

.packages {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.package {
  display: flex;
  gap: 10px;
  align-items: center;
}

.patch {
  display: flex;
  width: 170px;
  height: 54px;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 170px;
  height: 54px;
  background-color: #d61b1b;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0px 12px;
}

.plus-btn-container {
  width: 180px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plus-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 54px;
  background-color: #344e41;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0px 12px;
}

.proccesing-section {
  margin-top: 50px;
  display: flex;
  flex-direction: column;
}

.first-proccesing-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.submit-proccessing-btn {
  width: 308px;
  height: 54px;
  background-color: #344e41;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.second-proccesing-section {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-left: 30px;
}

.confirmation-section {
  margin-top: 40px;
  display: flex;
  gap: 20px;
}

.submit-confirmation-btn {
  width: 308px;
  height: 54px;
  background-color: #344e41;
  border: none;
  border-radius: 5px;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.status-section {
  margin-top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
}

.status-banner {
  width: 100%;
  max-width: 960px;
  padding: 12px 20px;
  border-radius: 10px;
  border: 1px solid #b7d5c7;
  background: #ecf5f0;
  color: #1f3c2d;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 6px 18px rgba(52, 78, 65, 0.08);
}

.status-banner.error {
  border-color: #f5c2c7;
  background: #fff1f2;
  color: #842029;
  box-shadow: 0 6px 18px rgba(132, 32, 41, 0.12);
}

.tariff-results-section {
  margin-top: 40px;
  width: 100%;
  max-width: 960px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tariff-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
}

.tariff-card {
  background: #fff;
  border: 1px solid #dfe6e2;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 18px 45px rgba(52, 78, 65, 0.08);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: pointer;
}

.tariff-card:hover {
  border-color: #344e41;
  transform: translateY(-2px);
  box-shadow: 0 22px 50px rgba(52, 78, 65, 0.12);
}

.tariff-card.active {
  border-color: #344e41;
  background: #f4f8f6;
  box-shadow: 0 24px 55px rgba(52, 78, 65, 0.14);
}

.tariff-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}

.tariff-card__name {
  font-weight: 600;
  font-size: 16px;
  color: #1f3c2d;
}

.tariff-card__category {
  font-size: 12px;
  font-weight: 500;
  color: #588157;
  background: #e8f5e9;
  padding: 3px 10px;
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
}

.tariff-card__price {
  font-weight: 700;
  font-size: 18px;
  color: #344e41;
}

.tariff-card__description {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
}

.tariff-card__meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #4f4f4f;
}

.tariff-card__select {
  align-self: flex-start;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid #344e41;
  background: transparent;
  color: #344e41;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tariff-card__select:hover,
.tariff-card__select:focus {
  background: #344e41;
  color: white;
}

.tariff-card.active .tariff-card__select {
  background: #344e41;
  color: white;
}
</style>
