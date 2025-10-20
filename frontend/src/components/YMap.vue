<script setup lang="ts">
import {
  YandexMap,
  YandexMapClusterer,
  YandexMapDefaultFeaturesLayer,
  YandexMapDefaultSchemeLayer,
  YandexMapMarker,
} from 'vue-yandex-maps'
import { onMounted, ref, shallowRef, version, watch } from 'vue'
import type { YMap } from '@yandex/ymaps3-types'
import type { YMapClusterer } from '@yandex/ymaps3-types/packages/clusterer'

// const pointList = ref<Array<[number, number]>>([])
const pointList = ref<Array<[number, number]>>([
  [37.617644, 55.755819],
  [37.627644, 55.765819],
  [37.637644, 55.775819],
  [37.647644, 55.785819],
  [37.657644, 55.795819],
  [37.667644, 55.805819],
  [37.677644, 55.815819],
  [37.687644, 55.825819],
  [37.697644, 55.835819],
  [37.707644, 55.845819],
  [37.717644, 55.855819],
  [37.727644, 55.865819],
  [37.737644, 55.875819],
  [37.747644, 55.885819],
  [37.757644, 55.895819],
])

const map = shallowRef<YMap | null>(null)
const clusterer = shallowRef<YMapClusterer | null>(null)
const gridSize = ref(6)
const zoom = ref(0)

onMounted(() => {
  if (version.startsWith('2')) return
  setInterval(() => {
    if (map.value) {
      zoom.value = map.value.zoom
    }
  }, 1000)
})

watch(map, (val) => console.log('map', val))
watch(clusterer, (val) => console.log('cluster', val))

</script>

<template>
  <yandex-map
    v-model="map"
    cursor-grab
    height="100%"
    :settings="{
      location: {
        center: [37.617644, 55.755819],
        zoom: 9,
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
        v-for="coordinates in pointList"
        :key="coordinates.join(',')"
        :settings="{
          coordinates,
          onClick: () => (console.log('Marker clicked:', coordinates)),
        }"
      >
        <div
          class="marker"
        />
      </yandex-map-marker>
      <template #cluster="{ length }">
        <div
          class="cluster fade-in"
        >
          {{ length }}
        </div>
      </template>
    </yandex-map-clusterer>
  </yandex-map>
</template>

<style scoped>
.bounds {
  user-select: all;
}

.marker {
  background: green;
  border-radius: 100%;
  width: 20px;
  height: 20px;
}

.cluster {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  background: green;
  color: #fff;
  border-radius: 100%;
  cursor: pointer;
  border: 2px solid limegreen;
  outline: 2px solid green;
  text-align: center;
}

.padded {
  padding: 5px;
}

.fade-in {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
