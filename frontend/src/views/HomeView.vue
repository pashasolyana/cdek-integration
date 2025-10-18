<script setup lang="ts">
import {
  mdiPlusBoxMultipleOutline,
  mdiFileOutline,
  mdiPrinterOutline,
  mdiTruckDeliveryOutline,
} from '@mdi/js'

const heroActions = [
  {
    label: 'Создать заказ',
    icon: mdiPlusBoxMultipleOutline,
    to: { name: 'order-create' },
  },
  {
    label: 'Список отправлений',
    icon: mdiFileOutline,
    to: { name: 'orders' },
  },
  {
    label: 'Печать накладных',
    icon: mdiPrinterOutline,
    to: { name: 'orders', query: { view: 'invoices' } },
  },
  {
    label: 'Печать этикеток',
    icon: mdiPrinterOutline,
    to: { name: 'orders', query: { view: 'labels' } },
  },
  {
    label: 'Отследить посылку',
    icon: mdiTruckDeliveryOutline,
    to: { name: 'track' },
  },
  {
    label: 'Отменить заказ',
    to: { name: 'orders', query: { action: 'cancel' } },
    variant: 'primary',
  },
]
</script>

<template>
  <section class="hero">
    <div class="hero-card">
      <h1 class="hero-title">Сервис по оформлению<br />посылок</h1>
      <p class="hero-subtitle">Подключайся и зарабатывай на доставке</p>
    </div>
    <div class="hero-actions">
      <RouterLink
        v-for="action in heroActions"
        :key="action.label"
        class="action"
        :class="{ 'action--primary': action.variant === 'primary' }"
        :to="action.to"
      >
        <svg
          v-if="action.icon"
          class="action-icon"
          viewBox="0 0 24 24"
          width="32"
          height="32"
          aria-hidden="true"
        >
          <path :d="action.icon" fill="currentColor" />
        </svg>
        <span>{{ action.label }}</span>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 44px 210px 0 210px;
  height: 100%;
}

.hero-card {
  background: #cedfcd;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(17, 24, 39, 0.04);
  padding: 120px 180px;
}

.hero-title {
  color: #344e41;
  font-size: 98px;
}
.hero-subtitle {
  color: #3f5f51;
  font-size: 32px;
}

.hero-actions {
  padding: 76px 114px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 50px 80px;
}

.action {
  height: 100px;
  border-radius: 14px;
  border: 1.5px solid #cfd8d3;
  background: #ffffff;
  color: #2d3e37;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  padding: 20px 50px;
  transition:
    transform 0.12s ease,
    box-shadow 0.12s ease,
    border-color 0.12s ease;
  text-decoration: none;
}
.action:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
  border-color: #9fb3a9;
}
.action-icon {
  font-size: 28px !important;
}

.action.action--primary {
  background: #1f402e;
  color: #fff;
  border-color: #1f402e;
}
.action.action--primary:hover {
  box-shadow: 0 10px 22px rgba(31, 64, 46, 0.25);
}

@media (max-width: 1440px) {
  .hero-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1024px) {
  .hero-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>