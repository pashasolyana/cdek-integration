<script setup lang="ts">
import AppShell from '@/layouts/AppShell.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <AppShell>
    <RouterView />
  </AppShell>
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