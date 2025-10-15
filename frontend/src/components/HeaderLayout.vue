<template>
  <header class="topbar">
    <div class="topbar__inner">
      <a class="brand" href="/">
        <span class="brand__text">BEGUN</span><span class="brand__text">OK</span
        ><span class="brand__ok">.PRO</span>
      </a>

      <nav class="menu">
        <a href="#about" :class="{ active: activeHash === '#individuals' }">Частным лицам</a>
        <a href="#contacts" :class="{ active: activeHash === '#catalog' }">Каталог</a>
      </nav>
    </div>
    <!-- <div class="promo">
      <div>
        <button class="promo__btn">Подробнее</button>
        <p class="promo__text">Приведи друга и получи бонус</p>
      </div>
    </div> -->

    <div class="btn__container">
      <button type="button" class="login-btn" @click="goLogin">Войти/Регистрация</button>
      <button class="icon-btn" type="button" @click="" title="Скачать CSV">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path :d="mdiCartOutline" />
        </svg>
      </button>
    </div>
  </header>
  <!-- <div class="packages">
    <nav class="actions actions--bar">
      <button type="button" class="btn btn--first">Список отправлений</button>
      <button type="button" class="btn btn--second">Создать заказ</button>
      <button type="button" class="btn btn--empty" aria-label="Пустая кнопка"></button>
      <button type="button" class="btn btn--empty" aria-label="Пустая кнопка"></button>
      <button type="button" class="btn" disabled title="Недоступно">Печать этикеток</button>
      <button type="button" class="btn" disabled title="Недоступно">Печать накладных</button>
      <button type="button" class="btn btn--first">Отследить посылку</button>
    </nav>
    <button type="button" class="btn--icon" aria-label="Настройки">
      <span aria-hidden="true">⚙</span>
    </button>
  </div> -->
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { mdiCartOutline } from '@mdi/js'
import { useRouter } from 'vue-router'

// track current hash for active menu highlighting
const activeHash = ref<string>('')

const syncActive = () => {
  activeHash.value = window.location.hash || '#individuals'
}
const router = useRouter()
const goLogin = () => router.push('/login')
onMounted(() => {
  syncActive()
  window.addEventListener('hashchange', syncActive)
})

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncActive)
})
</script>

<style scoped>
/* Шапка на всю ширину, фиксированная высота */
.topbar {
  height: var(--header-h);
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
}

/* Строгое выравнивание: бренд | меню | баннер */
.topbar__inner {
  height: var(--h);
  max-width: 1440px;
  padding: 0 45px;
  display: grid;
  grid-template-columns: auto 1fr;
  /* was: auto 1fr minmax(480px, 600px) */
  align-items: center;
  column-gap: 67px;
}

.login-btn {
  border: 1px solid #a3b18a;
  border-radius: 5px;
  width: 184px;
  height: 39px;
  align-self: center;
  color: black;
  font-size: 16px;
}

.btn__container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 77px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.icon-btn:hover {
  filter: brightness(0.98);
}

.icon-btn svg {
  width: 32px;
  height: 32px;
  fill: black;
}

.brand {
  color: var(--brand);
  text-decoration: none;
  white-space: nowrap;
  font-size: 40px;
  letter-spacing: 0.4px;
  line-height: 1;
  font-family: 'Source Sans Pro', sans-serif;
  -webkit-text-stroke: 0.5px var(--ok);
  text-shadow:
    -0.5px -0.5px 0 var(--ok),
    0.5px -0.5px 0 var(--ok),
    -0.5px 0.5px 0 var(--ok),
    0.5px 0.5px 0 var(--ok);
}

.brand__text {
  font-weight: normal;
}

.brand__ok {
  color: var(--ok);
  font-weight: normal;
}

.menu {
  display: flex;
  gap: 44px;
  align-items: center;
}

.menu a {
  color: var(--link);
  text-decoration: none;
  font-weight: 500;
  font-size: 18px;
}

.menu a:hover {
  opacity: 0.75;
}

.menu a.active {
  color: var(--ok);
  font-weight: 700;
}

/* actions bar under topbar */
.actions--bar {
  max-width: 1440px;
  padding: 11px 0 11px 16px;
  justify-content: flex-end;
  /* complements .actions flex */
}

.packages {
  background: var(--bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 7px;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: start;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 7px;
  width: 100%;
}

.btn {
  border-radius: 8px;
  border: none;
  background: #fff;
  color: var(--link);

  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.btn:hover {
  filter: brightness(0.98);
}

.btn--primary {
  background: var(--btn);
  border-color: var(--btn);
  color: #fff;
}

.btn--first {
  padding: 8px 16px;
}

.btn--second {
  padding: 8px 60px 8px 48px;
}

.btn--empty {
  height: 32px;
  width: 48px;
}

.btn--icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin-right: 16px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #e5e7eb;
  color: #6b7280;
  border-color: #e5e7eb;
  padding: 8px 26px;
}

/* Баннер как background, ничего не режется <img>-ом */
.promo {
  position: relative;
  height: 57px;
  width: 533px;
  background: url('../assets/images/promo.jpg') left center / cover no-repeat;
  /* помести файл в /public/images/promo.jpg */
}

.promo__text {
  position: absolute;
  left: 130px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}

/* Кнопка поверх баннера */
.promo__btn {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  padding: 8px 18px;
  border: 0;
  border-radius: 3px;
  background: var(--btn);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 6px rgba(0, 0, 0, 0.1);
}

.promo__btn:hover {
  filter: brightness(0.96);
}

/* Адаптив */
@media (max-width: 1024px) {
  .brand {
    font-size: 24px;
  }

  .topbar__inner {
    grid-template-columns: auto 1fr;
    /* was: auto 1fr 420px */
  }
}

@media (max-width: 820px) {
  .menu {
    display: none;
  }

  .topbar__inner {
    grid-template-columns: auto 1fr;
  }
}
</style>
