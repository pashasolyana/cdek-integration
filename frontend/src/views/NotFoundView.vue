<script setup lang="ts"></script>

<template>
  <div class="not-found">
    <div class="topbar__inner">
      <div class="brand">
        <span class="brand__text">BEGUN</span><span class="brand__ok">OK</span
        ><span class="brand__text">.PRO</span>
      </div>
    </div>
    <h2 class="title">Страница в разработке</h2>
  </div>
</template>

<!-- Import global styles (fonts + CSS variables) specifically for this view -->
<style src="@/assets/styles/global.css"></style>

<style scoped>
.topbar__inner {
  height: clamp(100px, 167px);
  max-width: 1440px;
  padding: 20px 80px 20px 80px;
  display: grid;
  grid-template-columns: auto 1fr; /* was: auto 1fr minmax(480px, 600px) */
  align-items: center;
  background: var(--bg);
}

.not-found {
  place-items: center;
  text-align: center;
  margin-top: 217px;
}
.brand {
  color: var(--brandWhite);
  text-decoration: none;
  white-space: nowrap;
  /* Responsive: min 28px, scales with viewport, max 128px */
  font-size: clamp(28px, 12vw, 128px);
  letter-spacing: 0.4px;
  line-height: 1;
  font-family: 'Source Sans Pro', sans-serif;
}
.brand__text {
  font-weight: 900;
}

.brand__ok {
  color: var(--brand);
  font-weight: 900;
}
.title {
  margin: 0.5rem 0 1rem;
  color: #000000;
  /* Responsive: min 20px, scales with viewport, max 96px */
  font-size: clamp(20px, 6vw, 96px);
  font-weight: 900;
  font-family: 'Source Sans Pro', sans-serif;
}
</style>
