import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import CreateOrderView from '@/views/CreateOrderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      // meta: { requiresAuth: true }  // Временно убираем авторизацию для тестирования
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true, hideHeader: true },
    },
    {
      path: '/r',
      name: 'register',
      component: RegisterView,
      meta: { guest: true, hideHeader: true },
    },
    {
      path: '/order/create',
      name: 'create-order',
      component: CreateOrderView,
      // meta: { requiresAuth: true }  // Временно убираем авторизацию для тестирования
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Проверяем авторизацию при первом запуске
  if (!authStore.user) {
    await authStore.checkAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isGuestRoute = to.matched.some((record) => record.meta.guest)

  if (requiresAuth && !isAuthenticated) {
    // Требуется авторизация, но пользователь не авторизован
    next('/login')
  } else if (isGuestRoute && isAuthenticated) {
    // Пользователь авторизован, но пытается попасть на страницу для гостей
    next('/')
  } else {
    next()
  }
})

export default router
