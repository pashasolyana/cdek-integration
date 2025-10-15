<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderLayout from '@/components/HeaderLayout.vue'
import FooterLayout from '@/components/FooterLayout.vue'

const route = useRoute()
const headerShown = computed(() => !route.matched.some((r) => r.meta.hideHeader))
const footerShown = computed(() => !route.matched.some((r) => r.meta.hideFooter))

const cssVars = computed(() => ({
  '--header-current': headerShown.value ? 'var(--header-h)' : '0px',
  '--footer-current': footerShown.value ? 'var(--footer-h)' : '0px',
}))
</script>

<template>
  <div class="app-shell" :style="cssVars">
    <HeaderLayout v-if="headerShown" />
    <main class="page">
      <slot />
    </main>
    <FooterLayout v-if="footerShown" />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100dvh;
  flex-direction: column;
}

.page {
  flex: 1 0 auto;
  min-height: calc(100dvh - var(--header-current) - var(--footer-current));
  overflow: clip;
}
</style>
