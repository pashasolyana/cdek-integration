import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '../views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ForgotPassword from '@/views/ForgotPassword.vue'
import Track from '@/views/Track.vue'
import CreateOrderView from '@/views/CreateOrderView.vue'
import HomeView from '@/views/HomeView.vue'
import OrdersView from '@/views/OrdersView.vue'

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
      path: '/orders',
      name: 'orders',
      component: OrdersView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guest: true, hideFooter: true },
    },
    {
      path: '/r',
      name: 'register',
      component: RegisterView,
      meta: { guest: true, hideFooter: true },
    },
    {
      path: '/track',
      name: 'track',
      component: Track,
      meta: { guest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot',
      component: ForgotPassword,
      meta: { guest: true, hideFooter: true },
    },
    {
      path: '/404',
      name: 'not-found',
      component: NotFoundView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/404',
    },
    {
      path: '/order/create',
      name: 'order-create',
      component: CreateOrderView,
      meta: { guest: true },
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
