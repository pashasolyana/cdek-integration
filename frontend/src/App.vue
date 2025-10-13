<script setup lang="ts">
import { useRoute, RouterView } from 'vue-router'
import { computed } from 'vue'
import HeaderLayout from './components/HeaderLayout.vue'

const route = useRoute()
const hideHeader = computed(() => route.matched.some((r) => r.meta.hideHeader))
</script>

<template>
  <HeaderLayout v-if="!hideHeader" />
  <RouterView />
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.5;
  color: #333;
  background: rgb(242, 242, 242);
}
</style>
