import axios, { type AxiosInstance } from 'axios'

class ApiService {
  private api: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: any) => void
    reject: (error?: any) => void
  }> = []

  constructor() {
    this.api = axios.create({
      baseURL: '/api', // Используем проксированный путь
      withCredentials: true, // Важно для отправки cookies
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Interceptor для автоматического обновления токенов
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Если уже происходит обновление токена, добавляем запрос в очередь
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => {
              return this.api(originalRequest)
            }).catch((err) => {
              return Promise.reject(err)
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            await this.refreshTokens()
            this.processQueue(null)
            return this.api(originalRequest)
          } catch (refreshError) {
            this.processQueue(refreshError)
            // Перенаправляем на страницу входа если не удалось обновить токены
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      }
    )
  }

  private processQueue(error: any) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })

    this.failedQueue = []
  }

  private async refreshTokens() {
    const response = await axios.post('/api/auth/refresh', {}, {
      withCredentials: true
    })
    return response.data
  }

  // Методы для авторизации
  async login(phone: string, password: string) {
    const response = await this.api.post('/auth/login', { phone, password })
    return response.data
  }

  async register(phone: string, password: string) {
    const response = await this.api.post('/auth/register', { phone, password })
    return response.data
  }

  async logout() {
    const response = await this.api.post('/auth/logout')
    return response.data
  }

  async checkAuth() {
    const response = await this.api.get('/auth/me')
    return response.data
  }

  // Метод для получения экземпляра API (для других запросов)
  getInstance(): AxiosInstance {
    return this.api
  }
}

export const apiService = new ApiService()
export default apiService