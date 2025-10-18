<template>
  <footer class="bottombar">
    <div class="text-container">
      <p>Поддержка</p>
      <p>Наши сервисы</p>
      <p>Чат в месседжерах</p>
      <p>+7 (999)-009-00-00</p>
    </div>
  </footer>
</template>

<script setup lang="ts"></script>

<style scoped>
.bottombar {
  background: #344e41;
  border-top: 1px solid #fff;
  height: var(--footer-h);
  min-height: 80px;
  text-align: center;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-right: 80px;
  justify-content: center;
}

.text-container {
  text-align: left;
}
</style>