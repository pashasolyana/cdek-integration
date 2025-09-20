import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CdekAuthDto, CdekTokenResponse } from './dto/auth.dto';

@Injectable()
export class CdekService implements OnModuleInit {
  private readonly logger = new Logger(CdekService.name);
  private readonly apiClient: AxiosInstance;
  private readonly cdekApiUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private currentToken: CdekTokenResponse | null = null;
  private tokenRefreshing = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.cdekApiUrl = this.configService.get<string>('CDEK_API_URL') || 'https://api.cdek.ru';
    this.clientId = this.configService.get<string>('CDEK_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('CDEK_CLIENT_SECRET') || '';

    // Настраиваем Axios клиент
    this.apiClient = axios.create({
      baseURL: this.cdekApiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CDEK-Integration/1.0',
      },
    });

    // Добавляем интерсепторы для логирования и авторизации
    this.setupInterceptors();
  }

  /**
   * Инициализация модуля - получаем токен при старте
   */
  async onModuleInit() {
    try {
      await this.ensureValidToken();
      this.logger.log('CDEK сервис успешно инициализирован');
    } catch (error) {
      this.logger.error('Ошибка при инициализации CDEK сервиса:', error.message);
    }
  }

  /**
   * Обеспечивает наличие валидного токена
   */
  private async ensureValidToken(): Promise<void> {
    // Если токен есть и еще действителен (с запасом в 5 минут)
    if (this.currentToken && this.isTokenValid()) {
      return;
    }

    // Если уже идет обновление токена, ждем его завершения
    if (this.tokenRefreshing) {
      return new Promise((resolve) => {
        const checkToken = () => {
          if (!this.tokenRefreshing) {
            resolve();
          } else {
            setTimeout(checkToken, 100);
          }
        };
        checkToken();
      });
    }

    await this.refreshToken();
  }

  /**
   * Проверяет, действителен ли текущий токен
   */
  private isTokenValid(): boolean {
    if (!this.currentToken) return false;
    
    // Проверяем, не истечет ли токен в ближайшие 5 минут
    const expirationTime = Date.now() + (this.currentToken.expires_in * 1000);
    const bufferTime = 5 * 60 * 1000; // 5 минут в миллисекундах
    
    return expirationTime > Date.now() + bufferTime;
  }

  /**
   * Обновление токена
   */
  private async refreshToken(): Promise<void> {
    if (this.tokenRefreshing) return;

    this.tokenRefreshing = true;
    try {
      this.logger.log('Обновляем токен авторизации CDEK');

      // Сначала пробуем получить валидный токен из базы
      const existingToken = await this.getValidTokenFromDB();
      if (existingToken) {
        this.currentToken = {
          access_token: existingToken.accessToken,
          token_type: existingToken.tokenType,
          expires_in: existingToken.expiresIn,
          scope: existingToken.scope,
          jti: existingToken.jti,
        };
        this.logger.log('Получен действительный токен из базы данных');
        return;
      }

      // Запрашиваем новый токен от API
      const tokenData = await this.requestNewToken();
      this.currentToken = tokenData;
      
      // Сохраняем в базу данных
      await this.saveToken(tokenData);
      
      this.logger.log('Токен успешно обновлен');
    } catch (error) {
      this.logger.error('Ошибка при обновлении токена:', error.message);
      throw error;
    } finally {
      this.tokenRefreshing = false;
    }
  }

  /**
   * Запрос нового токена от CDEK API
   */
  private async requestNewToken(): Promise<CdekTokenResponse> {
    const authData = {
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    };

    const startTime = Date.now();
    
    try {
      const response = await axios.post<CdekTokenResponse>(
        `${this.cdekApiUrl}/v2/oauth/token`,
        new URLSearchParams(authData).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'CDEK-Integration/1.0',
          },
          timeout: 30000,
        }
      );

      const duration = Date.now() - startTime;
      this.logger.log(`Новый токен получен за ${duration}ms`);

      return response.data;
    } catch (error) {
      this.logger.error('Ошибка при запросе токена:', error.message);
      if (error.response) {
        this.logger.error('Ответ от сервера:', error.response.data);
        throw new HttpException(
          `Ошибка CDEK API: ${error.response.data?.message || error.message}`,
          error.response.status,
        );
      }
      throw new HttpException(
        'Ошибка соединения с CDEK API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Получение валидного токена из базы данных
   */
  private async getValidTokenFromDB() {
    try {
      const token = await this.prismaService.cdekToken.findFirst({
        where: {
          expiresAt: {
            gt: new Date(Date.now() + 5 * 60 * 1000), // Токен должен быть валиден еще 5 минут
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return token;
    } catch (error) {
      this.logger.warn('Ошибка при получении токена из БД:', error.message);
      return null;
    }
  }

  /**
   * Сохранение токена в базу данных
   */
  private async saveToken(tokenData: CdekTokenResponse) {
    try {
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      await this.prismaService.cdekToken.create({
        data: {
          accessToken: tokenData.access_token,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope,
          jti: tokenData.jti,
          expiresAt,
        },
      });

      this.logger.log('Токен сохранен в базу данных');
    } catch (error) {
      this.logger.error('Ошибка при сохранении токена в БД:', error.message);
    }
  }

  /**
   * Принудительное обновление токена (для тестирования)
   */
  async forceRefreshToken(): Promise<void> {
    this.logger.log('Принудительное обновление токена CDEK');
    
    // Сбрасываем текущий токен
    this.currentToken = null;
    
    // Запрашиваем новый токен
    await this.refreshToken();
  }

  /**
   * Выполнение авторизованного запроса к CDEK API
   */
  async makeAuthorizedRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ) {
    await this.ensureValidToken();

    const config: AxiosRequestConfig = {
      method,
      url: endpoint,
      headers: {
        Authorization: `${this.currentToken!.token_type} ${this.currentToken!.access_token}`,
        'Content-Type': 'application/json',
      },
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined,
    };

    const startTime = Date.now();
    
    try {
      const response = await this.apiClient.request(config);
      const duration = Date.now() - startTime;

      // Логируем успешный запрос
      await this.logApiCall(method, endpoint, data, response.data, response.status, duration, true);

      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Если получили 401, пробуем обновить токен и повторить запрос
      if (error.response?.status === 401) {
        this.logger.warn('Получен 401, обновляем токен и повторяем запрос');
        this.currentToken = null; // Сбрасываем текущий токен
        
        try {
          await this.refreshToken();
          
          // Повторяем запрос с новым токеном
          config.headers!.Authorization = `${this.currentToken!.token_type} ${this.currentToken!.access_token}`;
          const retryStartTime = Date.now();
          const retryResponse = await this.apiClient.request(config);
          const retryDuration = Date.now() - retryStartTime;

          await this.logApiCall(method, endpoint, data, retryResponse.data, retryResponse.status, retryDuration, true);
          return retryResponse.data;
        } catch (retryError) {
          const retryDuration = Date.now() - startTime;
          await this.logApiCall(
            method,
            endpoint,
            data,
            retryError.response?.data,
            retryError.response?.status,
            retryDuration,
            false,
          );
          throw retryError;
        }
      }

      // Логируем неуспешный запрос
      await this.logApiCall(
        method,
        endpoint,
        data,
        error.response?.data,
        error.response?.status,
        duration,
        false,
      );

      this.logger.error(`Ошибка при выполнении запроса ${method} ${endpoint}:`, error.message);
      throw error;
    }
  }

  /**
   * Логирование API запросов
   */
  private async logApiCall(
    method: string,
    endpoint: string,
    requestData: any,
    responseData: any,
    statusCode: number,
    duration: number,
    success: boolean,
  ) {
    try {
      await this.prismaService.apiLog.create({
        data: {
          method,
          endpoint,
          requestData: JSON.stringify(requestData),
          responseData: JSON.stringify(responseData),
          statusCode,
          duration,
          success,
        },
      });
    } catch (error) {
      this.logger.warn('Ошибка при логировании API запроса:', error.message);
    }
  }

  /**
   * Настройка интерсепторов Axios
   */
  private setupInterceptors() {
    // Интерсептор запросов - автоматически добавляем токен
    this.apiClient.interceptors.request.use(
      async (config) => {
        // Не добавляем токен для запросов авторизации
        if (!config.url?.includes('/oauth/token')) {
          await this.ensureValidToken();
          if (this.currentToken) {
            config.headers.Authorization = `${this.currentToken.token_type} ${this.currentToken.access_token}`;
          }
        }
        
        this.logger.debug(`Отправка запроса: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Ошибка в запросе:', error.message);
        return Promise.reject(error);
      },
    );

    // Интерсептор ответов - обрабатываем 401 ошибки
    this.apiClient.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `Получен ответ: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
        );
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/oauth/token')) {
          originalRequest._retry = true;
          
          this.logger.warn('Получен 401, обновляем токен через интерсептор');
          this.currentToken = null; // Сбрасываем текущий токен
          
          try {
            await this.refreshToken();
            originalRequest.headers.Authorization = `${this.currentToken!.token_type} ${this.currentToken!.access_token}`;
            return this.apiClient(originalRequest);
          } catch (refreshError) {
            this.logger.error('Ошибка при обновлении токена через интерсептор:', refreshError.message);
            return Promise.reject(refreshError);
          }
        }

        if (error.response) {
          this.logger.error(
            `Ошибка ответа: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          );
        } else {
          this.logger.error('Ошибка сети:', error.message);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * Удобные методы для HTTP запросов
   */
  async get(endpoint: string, params?: any) {
    return this.apiClient.get(endpoint, { params });
  }

  async post(endpoint: string, data?: any) {
    return this.apiClient.post(endpoint, data);
  }

  async put(endpoint: string, data?: any) {
    return this.apiClient.put(endpoint, data);
  }

  async delete(endpoint: string) {
    return this.apiClient.delete(endpoint);
  }

  /**
   * Получение информации о заказе по номеру СДЭК или ИМ
   */
  async getOrderInfo(cdekNumber?: number) {
    if (!cdekNumber ) {
      throw new HttpException(
        'Необходимо указать cdek_number или im_number',
        HttpStatus.BAD_REQUEST,
      );
    }

    const params: any = {};
    if (cdekNumber) {
      params.cdek_number = cdekNumber;
    }
 
    const response = await this.get('/v2/orders', params);
    console.log(response.data)
    return response.data;
  }

  /**
   * Получение информации о заказе (старый метод для обратной совместимости)
   */
  async getOrder(orderId: string) {
    const response = await this.get(`/v2/orders/${orderId}`);
    return response.data;
  }

  /**
   * Создание заказа
   */
  async createOrder(orderData: any) {
    const response = await this.post('/v2/orders', orderData);
    return response.data;
  }

  /**
   * Получение списка пунктов выдачи
   */
  async getDeliveryPoints(params?: any) {
    const response = await this.get('/v2/deliverypoints', params);
    return response.data;
  }

  /**
   * Расчет стоимости доставки
   */
  async calculateDelivery(calculationData: any) {
    const response = await this.post('/v2/calculator/tarifflist', calculationData);
    return response.data;
  }
}