// apiService.ts
import axios, { type AxiosInstance, type AxiosResponse } from 'axios'

/** ===== Типы для упрощенной регистрации ===== */
export interface RegisterPayload {
  firstName: string
  lastName: string
  email?: string
  phone: string
  password: string
}

/** ===== Типы для компании (личный кабинет) ===== */
export interface CompanyPayload {
  companyType: string
  companyName: string
  inn: string
  kpp?: string
  ogrn: string
  email?: string
  phone?: string
  bik: string
  settlementAccount: string
  correspondentAccount: string
  actualAddress: string
  legalIndex: string
  legalCity: string
  legalAddress: string
}

export interface AuthUser {
  id: number
  phone: string
  createdAt: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

class ApiService {
  private api: AxiosInstance
  private isRefreshing = false
  private failedQueue: Array<{
    resolve: (value?: AxiosResponse | void) => void
    reject: (error: unknown) => void
  }> = []

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    })

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject })
            }).then(() => this.api(originalRequest))
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            await this.refreshTokens()
            this.processQueue(null)
            return this.api(originalRequest)
          } catch (refreshError) {
            this.processQueue(refreshError)
            return Promise.reject(refreshError)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(error)
      },
    )
  }

  private processQueue(error: unknown) {
    this.failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()))
    this.failedQueue = []
  }

  private async refreshTokens() {
    const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
    return data
  }

  // ----- Auth -----
  async login(phone: string, password: string) {
    const { data } = await this.api.post<AuthResponse>('/auth/login', { phone, password })
    return data
  }

  /** Отправка кода подтверждения при регистрации */
  async sendRegistrationCode(phone: string) {
    const { data } = await this.api.post('/auth/register/send-code', { phone })
    return data
  }

  /** Верификация кода при регистрации */
  async verifyRegistrationCode(phone: string, code: string) {
    const { data } = await this.api.post('/auth/register/verify-code', { phone, code })
    return data
  }

  /** Регистрация (упрощенная, без компании) */
  async register(payload: RegisterPayload) {
    const { data } = await this.api.post<AuthResponse>('/auth/register', payload)
    return data
  }

  async logout() {
    const { data } = await this.api.post('/auth/logout')
    return data
  }

  async checkAuth() {
    const { data } = await this.api.get('/auth/me')
    return data
  }

  // ----- Company (Личный кабинет) -----
  async getCompany() {
    const { data } = await this.api.get('/company')
    return data.company // Извлекаем company из обертки
  }

  async createCompany(payload: CompanyPayload) {
    const { data } = await this.api.post('/company', payload)
    return data.company
  }

  async updateCompany(payload: CompanyPayload) {
    const { data } = await this.api.put('/company', payload)
    return data.company
  }

  async deleteCompany() {
    const { data } = await this.api.delete('/company')
    return data
  }

  getInstance(): AxiosInstance {
    return this.api
  }
}

export const apiService = new ApiService()
export default apiService
