# 📍 Руководство по интеграции с Dadata API

## 📑 Содержание

1. [Описание](#описание)
2. [Подсказки по адресам](#1-подсказки-по-адресам)
3. [Стандартизация адресов](#2-стандартизация-адресов)
4. [Геокодирование](#3-геокодирование)
5. [Интеграция с CDEK](#4-интеграция-с-cdek)
6. [Коды качества](#5-коды-качества)
7. [Примеры использования на фронтенде](#6-примеры-использования-на-фронтенде)

---

## Описание

**Dadata** — сервис для работы с адресами, который помогает:

✔️ **Автоматически заполнять адреса** на веб-формах с подсказками при вводе  
✔️ **Стандартизировать адреса** — разбивать по полям (регион, город, улица, дом, квартира)  
✔️ **Определять координаты** по адресу и наоборот  
✔️ **Получать коды** КЛАДР, ФИАС, ОКАТО, ОКТМО, почтовый индекс  
✔️ **Проверять качество адреса** для доставки  

### Настройка

В файле `.env` уже настроены ключи:

```env
DADATA_API_TOKEN=fd97964293967b1cf8455ac41685a7f19a5beb9d
DADATA_SECRET_KEY=98e142de70bde938918f64881a87f80ea81618c6
```

---

## 1. Подсказки по адресам

### 🎯 Endpoint
```
GET /dadata/suggest/address?query=Москва+Тверская
```

### 📝 Описание
Автодополнение адреса при вводе на форме. Возвращает стандартизированные адреса с КЛАДР, ФИАС, координатами.

### 📥 Параметры запроса

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `query` | string | ✅ | Строка для поиска адреса |
| `count` | number | ❌ | Количество подсказок (1-20, по умолчанию 10) |
| `from_bound` | string | ❌ | Начальный уровень: `country`, `region`, `city`, `settlement`, `street`, `house` |
| `to_bound` | string | ❌ | Конечный уровень |
| `kladr_id` | string | ❌ | КЛАДР-код для фильтрации по городу/региону |

### 📤 Пример ответа

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "value": "г Москва, ул Тверская",
        "unrestricted_value": "125009, г Москва, ул Тверская",
        "data": {
          "postal_code": "125009",
          "country": "Россия",
          "country_iso_code": "RU",
          "region": "Москва",
          "city": "Москва",
          "street": "Тверская",
          "street_with_type": "ул Тверская",
          "fias_id": "f26b876b-6857-4951-b060-ec6559f04a9a",
          "kladr_id": "7700000000038100",
          "geo_lat": "55.7595568",
          "geo_lon": "37.6123081",
          "qc_geo": 2
        }
      }
    ]
  },
  "message": "Подсказки получены",
  "count": 1
}
```

### 🔹 Гранулярные подсказки

#### Только города:
```
GET /dadata/suggest/city?query=Санкт
```

#### Только улицы в Москве:
```
GET /dadata/suggest/address?query=Тверская&from_bound=street&to_bound=street&kladr_id=7700000000000
```

---

## 2. Стандартизация адресов

### 🎯 Endpoint
```
POST /dadata/clean/address
```

### 📝 Описание
Разбивает адрес по отдельным полям, определяет индекс, координаты, коды КЛАДР/ФИАС/ОКАТО/ОКТМО.

### 📥 Тело запроса

```json
{
  "address": "мск сухонская 11 89"
}
```

### 📤 Ответ

```json
{
  "success": true,
  "data": [
    {
      "source": "мск сухонская 11 89",
      "result": "г Москва, ул Сухонская, д 11, кв 89",
      "postal_code": "127642",
      "country": "Россия",
      "country_iso_code": "RU",
      "region": "Москва",
      "city": "Москва",
      "street": "Сухонская",
      "street_with_type": "ул Сухонская",
      "house": "11",
      "flat": "89",
      "fias_id": "f26b876b-6857-4951-b060-ec6559f04a9a",
      "kladr_id": "7700000000038100",
      "geo_lat": "55.8782557",
      "geo_lon": "37.6577109",
      "qc": 0,
      "qc_complete": 0,
      "qc_house": 2,
      "qc_geo": 0
    }
  ],
  "message": "Адрес стандартизирован"
}
```

---

## 3. Геокодирование

### 3.1. Прямое геокодирование (адрес → координаты)

#### 🎯 Endpoint
```
GET /dadata/geocode?address=Москва+Красная+площадь+1
```

#### 📤 Ответ

```json
{
  "success": true,
  "data": {
    "address": "г Москва, Красная пл, д 1",
    "unrestricted_value": "109012, г Москва, Красная пл, д 1",
    "latitude": 55.7539303,
    "longitude": 37.620795,
    "postal_code": "109012",
    "kladr_id": "7700000000000",
    "fias_id": "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
    "qc_geo": 0
  },
  "message": "Координаты определены"
}
```

### 3.2. Обратное геокодирование (координаты → адрес)

#### 🎯 Endpoint
```
GET /dadata/reverse-geocode?latitude=55.7558&longitude=37.6173
```

---

## 4. Интеграция с CDEK

### 🎯 Endpoint
```
GET /dadata/address-info?address=Москва+Тверская+12
```

### 📝 Описание
Возвращает полную информацию об адресе, готовую для передачи в CDEK API.

### 📤 Ответ

```json
{
  "success": true,
  "data": {
    "value": "г Москва, ул Тверская, д 12",
    "unrestricted_value": "125009, г Москва, ул Тверская, д 12",
    "postal_code": "125009",
    "country_code": "RU",
    "city": "Москва",
    "address": "ул Тверская, д 12",
    "latitude": 55.7595,
    "longitude": 37.6123,
    "fias_id": "f26b876b-6857-4951-b060-ec6559f04a9a",
    "kladr_id": "7700000000038100",
    "region": "Москва",
    "region_code": null,
    "city_code": null,
    "qc_geo": 0,
    "qc_complete": 0,
    "full_data": { /* полные данные */ }
  },
  "message": "Информация получена"
}
```

### 🔗 Использование с CDEK

```javascript
// 1. Получить информацию об адресе
const dadataResponse = await fetch(`/dadata/address-info?address=${encodeURIComponent(address)}`);
const { data: addressInfo } = await dadataResponse.json();

// 2. Найти код города CDEK
const cdekCityResponse = await fetch(
  `/cdek/location/suggest/cities?name=${encodeURIComponent(addressInfo.city)}`
);
const { data: cities } = await cdekCityResponse.json();
const cityCode = cities[0]?.code;

// 3. Использовать в CDEK API
const cdekOrder = {
  type: 1,
  tariff_code: 137,
  to_location: {
    code: cityCode,
    city: addressInfo.city,
    postal_code: addressInfo.postal_code,
    address: addressInfo.address,
    latitude: addressInfo.latitude,
    longitude: addressInfo.longitude
  },
  recipient: { /* ... */ },
  packages: [ /* ... */ ]
};
```

---

## 5. Коды качества

### 5.1. Код проверки адреса (qc)

| Код | Описание | Нужна проверка? |
|-----|----------|-----------------|
| `0` | Адрес распознан уверенно | ❌ Нет |
| `1` | Остались лишние части или недостаточно данных | ✅ Да |
| `2` | Адрес пустой или мусорный | ❌ Нет |
| `3` | Есть альтернативные варианты | ✅ Да |

### 5.2. Код пригодности к рассылке (qc_complete)

| Код | Описание | Подходит? |
|-----|----------|-----------|
| `0` | Пригоден для почтовой рассылки | ✅ Да |
| `1` | Нет региона | ❌ Нет |
| `2` | Нет города | ❌ Нет |
| `3` | Нет улицы | ❌ Нет |
| `4` | Нет дома | ❌ Нет |
| `5` | Нет квартиры (подходит для юр.лиц) | ⚠️ Под вопросом |
| `6` | Адрес неполный | ❌ Нет |
| `7` | Иностранный адрес | ❌ Нет |
| `8` | До почтового отделения | ⚠️ Под вопросом |
| `9` | Проверьте правильность разбора | ⚠️ Под вопросом |
| `10` | Дома нет в ФИАС | ⚠️ Под вопросом |

### 5.3. Код точности координат (qc_geo)

| Код | Описание | Качество |
|-----|----------|----------|
| `0` | Точные координаты | ✅ Отлично |
| `1` | Ближайший дом | ✅ Хорошо |
| `2` | Улица | ⚠️ Средне |
| `3` | Населенный пункт | ⚠️ Плохо |
| `4` | Город | ❌ Очень плохо |
| `5` | Координаты не определены | ❌ Неизвестно |

### 5.4. Наличие дома в ФИАС (qc_house)

| Код | Описание |
|-----|----------|
| `2` | Дом найден в ФИАС |
| `10` | Дом не найден в ФИАС |

---

## 6. Примеры использования на фронтенде

### 6.1. Автокомплит адреса

```vue
<template>
  <div class="address-autocomplete">
    <input
      v-model="query"
      @input="onInput"
      placeholder="Начните вводить адрес"
    />
    <ul v-if="suggestions.length">
      <li
        v-for="item in suggestions"
        :key="item.data.fias_id"
        @click="selectAddress(item)"
      >
        {{ item.value }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const query = ref('');
const suggestions = ref([]);

const searchAddress = async (q) => {
  if (q.length < 3) {
    suggestions.value = [];
    return;
  }

  try {
    const response = await fetch(
      `/dadata/suggest/address?query=${encodeURIComponent(q)}`
    );
    const { data } = await response.json();
    suggestions.value = data.suggestions || [];
  } catch (error) {
    console.error('Ошибка поиска адреса:', error);
  }
};

const onInput = useDebounceFn(async () => {
  await searchAddress(query.value);
}, 300);

const selectAddress = (item) => {
  query.value = item.value;
  suggestions.value = [];
  
  // Emit событие с полными данными
  emit('select', {
    address: item.value,
    postal_code: item.data.postal_code,
    city: item.data.city,
    latitude: parseFloat(item.data.geo_lat),
    longitude: parseFloat(item.data.geo_lon),
    fias_id: item.data.fias_id,
    kladr_id: item.data.kladr_id,
  });
};
</script>
```

### 6.2. Поиск только города

```javascript
async function searchCity(query) {
  const response = await fetch(
    `/dadata/suggest/city?query=${encodeURIComponent(query)}`
  );
  const { data } = await response.json();
  
  return data.suggestions.map(item => ({
    name: item.value,
    postal_code: item.data.postal_code,
    fias_id: item.data.fias_id,
    kladr_id: item.data.kladr_id,
  }));
}
```

### 6.3. Проверка качества адреса

```javascript
async function validateAddress(address) {
  // Стандартизируем адрес
  const response = await fetch('/dadata/clean/address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address })
  });
  
  const { data } = await response.json();
  const cleaned = data[0];
  
  // Проверяем качество
  const quality = {
    isGood: cleaned.qc === 0 && cleaned.qc_complete === 0,
    hasCoordinates: cleaned.qc_geo <= 1,
    hasHouse: cleaned.qc_house === 2,
    issues: []
  };
  
  if (cleaned.qc !== 0) {
    quality.issues.push('Адрес требует проверки');
  }
  if (cleaned.qc_complete !== 0) {
    quality.issues.push('Адрес неполный или некорректный');
  }
  if (cleaned.qc_geo > 1) {
    quality.issues.push('Координаты определены неточно');
  }
  
  return {
    cleaned,
    quality
  };
}
```

### 6.4. Определение города по IP пользователя

```javascript
async function detectUserCity() {
  try {
    // Получаем IP пользователя (можно использовать внешний сервис)
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const { ip } = await ipResponse.json();
    
    // Определяем город по IP
    const dadataResponse = await fetch(
      `/dadata/detect-city?ip=${ip}`
    );
    const { data } = await dadataResponse.json();
    
    if (data.location) {
      return {
        city: data.location.data.city,
        region: data.location.data.region,
        latitude: parseFloat(data.location.data.geo_lat),
        longitude: parseFloat(data.location.data.geo_lon),
      };
    }
  } catch (error) {
    console.error('Не удалось определить город:', error);
  }
  
  return null;
}
```

### 6.5. Полный пример формы с адресом

```vue
<template>
  <div class="address-form">
    <h3>Адрес доставки</h3>
    
    <!-- Автокомплит города -->
    <AddressAutocomplete
      v-model="form.city"
      type="city"
      placeholder="Город"
      @select="onCitySelect"
    />
    
    <!-- Автокомплит улицы (фильтр по выбранному городу) -->
    <AddressAutocomplete
      v-model="form.street"
      type="street"
      :kladr-id="form.cityKladrId"
      placeholder="Улица"
      :disabled="!form.cityKladrId"
      @select="onStreetSelect"
    />
    
    <!-- Автокомплит дома -->
    <AddressAutocomplete
      v-model="form.house"
      type="house"
      :kladr-id="form.streetKladrId"
      placeholder="Дом"
      :disabled="!form.streetKladrId"
      @select="onHouseSelect"
    />
    
    <!-- Квартира -->
    <input
      v-model="form.flat"
      placeholder="Квартира"
    />
    
    <!-- Информация о качестве адреса -->
    <div v-if="addressQuality" class="quality-info">
      <span :class="`quality-${addressQuality.quality}`">
        {{ addressQuality.quality === 'excellent' ? '✅ Адрес корректен' : '⚠️ Проверьте адрес' }}
      </span>
      <ul v-if="addressQuality.issues.length">
        <li v-for="issue in addressQuality.issues" :key="issue">
          {{ issue }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const form = ref({
  city: '',
  cityKladrId: '',
  street: '',
  streetKladrId: '',
  house: '',
  flat: '',
  postal_code: '',
  latitude: null,
  longitude: null,
});

const addressQuality = ref(null);

const onCitySelect = (data) => {
  form.value.cityKladrId = data.kladr_id;
  form.value.postal_code = data.postal_code;
};

const onStreetSelect = (data) => {
  form.value.streetKladrId = data.kladr_id;
};

const onHouseSelect = async (data) => {
  form.value.latitude = data.latitude;
  form.value.longitude = data.longitude;
  
  // Проверяем качество адреса
  const fullAddress = `${form.value.city}, ${form.value.street}, ${form.value.house}`;
  addressQuality.value = await validateAddress(fullAddress);
};
</script>
```

---

## 📌 Важные замечания

1. **Автокомплит работает с 3-го символа** для оптимизации запросов
2. **Используйте debounce** (300-500мс) при вводе для уменьшения нагрузки
3. **Кэшируйте результаты** на клиенте для одинаковых запросов
4. **Всегда проверяйте qc-коды** перед отправкой заказа в CDEK
5. **Для CDEK нужен city_code** — получайте его через `/cdek/location/suggest/cities` после выбора города в Dadata

---

**Версия документа:** 1.0  
**Дата:** 2025-10-19  
**Автор:** GitHub Copilot
