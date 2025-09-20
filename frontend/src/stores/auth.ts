import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface User {
  id: number
  phone: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)

  // Actions
  const login = async (phone: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await apiService.login(phone, password)
      user.value = data.user
      
      return { success: true }
    } catch (err: any) {
      // Обрабатываем ошибки валидации
      if (err.response?.data?.errors) {
        error.value = formatValidationErrors(err.response.data.errors)
      } else {
        error.value = err.response?.data?.message || 'Ошибка входа'
      }
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (phone: string, password: string) => {
    try {
      isLoading.value = true
      error.value = null

      const data = await apiService.register(phone, password)
      user.value = data.user
      
      return { success: true }
    } catch (err: any) {
      // Обрабатываем ошибки валидации
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors
        const errorMessages = Object.values(validationErrors).flat()
        error.value = errorMessages.join('. ')
      } else {
        error.value = err.response?.data?.message || 'Ошибка регистрации'
      }
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      await apiService.logout()
    } catch (err) {
      console.error('Ошибка при выходе:', err)
    } finally {
      user.value = null
      error.value = null
    }
  }

  const checkAuth = async () => {
    try {
      isLoading.value = true
      const data = await apiService.checkAuth()
      user.value = data.user
      return true
    } catch (err) {
      user.value = null
      return false
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  // Вспомогательная функция для форматирования ошибок
  const formatValidationErrors = (errors: any) => {
    if (!errors) return null
    
    const errorMessages: string[] = []
    Object.entries(errors).forEach(([field, messages]: [string, any]) => {
      if (Array.isArray(messages)) {
        errorMessages.push(...messages)
      }
    })
    
    return errorMessages.join('. ')
  }

  return {
    // State
    user,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    login,
    register,
    logout,
    checkAuth,
    clearError
  }
})