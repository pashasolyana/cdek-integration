import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { promises as fs, existsSync } from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CdekAuthDto, CdekTokenResponse } from './dto/auth.dto';
import {
  CalcTariffListRequestDto,
  CalcTariffListResponseDto,
} from './dto/calculator.dto';
import { Prisma, CdekOfficeType } from '@prisma/client';
import { CreateCdekOrderDto } from './dto/create-cdek-order.dto';
import {
  PrintReceiptRequestDto,
  PrintBarcodeRequestDto,
  PrintJobKind,
  PrintJobResponseDto,
  PrintOrderDto,
} from './dto/print.dto';
import { PrintWaybillRequestDto, WaybillDto } from './dto/print-waybill.dto';
import {
  PrintBarcodeRequestDto as PrintBarcodeRequestDtoV2,
  BarcodeDto,
} from './dto/print-barcode.dto';

interface StoredPrintJobMeta extends PrintJobResponseDto {
  payload: Record<string, any>;
  statuses?: Array<Record<string, any>>;
  contentType?: string | null;
}

interface ResolvedPrintJobFile {
  meta: StoredPrintJobMeta;
  absolutePath: string;
}
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
    this.cdekApiUrl =
      this.configService.get<string>('CDEK_API_URL') || 'https://api.cdek.ru';
    this.clientId = this.configService.get<string>('CDEK_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('CDEK_CLIENT_SECRET') || '';

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
      this.logger.error(
        'Ошибка при инициализации CDEK сервиса:',
        error.message,
      );
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
    const expirationTime = Date.now() + this.currentToken.expires_in * 1000;
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
        },
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
      const rawExpiresIn = Number(tokenData.expires_in);
      if (!Number.isFinite(rawExpiresIn) || rawExpiresIn <= 0) {
        throw new Error(
          `Некорректное значение expires_in: ${JSON.stringify(tokenData.expires_in)}`,
        );
      }

      const expiresAt = new Date(Date.now() + rawExpiresIn * 1000);
      if (Number.isNaN(expiresAt.getTime())) {
        throw new Error('Не удалось вычислить expiresAt для токена CDEK');
      }

      await this.prismaService.$transaction(async (tx) => {
        await tx.cdekToken.deleteMany({});
        await tx.cdekToken.create({
          data: {
            accessToken: tokenData.access_token,
            tokenType: tokenData.token_type,
            expiresIn: rawExpiresIn,
            scope: tokenData.scope ?? undefined,
            jti: tokenData.jti ?? undefined,
            expiresAt,
          },
        });
      });

      this.logger.log('Токен сохранен в базу данных');
    } catch (error) {
      this.logger.error('Ошибка при сохранении токена в БД:', error.message);
      throw error;
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
      await this.logApiCall(
        method,
        endpoint,
        data,
        response.data,
        response.status,
        duration,
        true,
      );

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

          await this.logApiCall(
            method,
            endpoint,
            data,
            retryResponse.data,
            retryResponse.status,
            retryDuration,
            true,
          );
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

      this.logger.error(
        `Ошибка при выполнении запроса ${method} ${endpoint}:`,
        error.message,
      );
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

        this.logger.debug(
          `Отправка запроса: ${config.method?.toUpperCase()} ${config.url}`,
        );
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

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/oauth/token')
        ) {
          originalRequest._retry = true;

          this.logger.warn('Получен 401, обновляем токен через интерсептор');
          this.currentToken = null; // Сбрасываем текущий токен

          try {
            await this.refreshToken();
            originalRequest.headers.Authorization = `${this.currentToken!.token_type} ${this.currentToken!.access_token}`;
            return this.apiClient(originalRequest);
          } catch (refreshError) {
            this.logger.error(
              'Ошибка при обновлении токена через интерсептор:',
              refreshError.message,
            );
            return Promise.reject(refreshError);
          }
        }

        if (error.response) {
          this.logger.error(
            `Ошибка ответа: ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          );
          const firstRequest = error.response.data?.requests?.[0];
          if (firstRequest) {
            console.log(firstRequest);
          } else if (error.response.data) {
            console.log(error.response.data);
          }
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

  protected async post<T = any>(
    path: string,
    data?: any,
    headers: Record<string, string> = {},
  ): Promise<T> {
    try {
      const res = await this.apiClient.post(path, data, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
      });
      return res.data as T;
    } catch (err: any) {
      // Сохраним подробности — это поможет понять, какие поля не приняты
      const status = err?.response?.status;
      const payload = err?.response?.data;
      this.logger.error(
        `[CDEK POST ${path}] ${status}`,
        JSON.stringify(payload, null, 2),
      );
      throw err; // не глотаем — контроллер поднимет 4xx/5xx
    }
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
    if (!cdekNumber) {
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
    console.log(response);
    return response.data;
  }

  /**
   * Получение информации о заказе (старый метод для обратной совместимости)
   */
  async getOrder(orderId: string) {
    const response = await this.get(`/v2/orders/${orderId}`);
    return response.data;
  }

  async calculateTariffList(body: CalcTariffListRequestDto) {
    this.logger.log('Запрос на расчёт тарифов:', JSON.stringify(body, null, 2));
    const response = await this.post('/v2/calculator/tarifflist', body);
    console.log(response);
    this.logger.log('Ответ CDEK API:', JSON.stringify(response.data, null, 2));
    return response as CalcTariffListResponseDto;
  }

  /** /v2/location/suggest/cities */
  async suggestCities(params: {
    name: string;
    country_codes?: string;
    size?: number;
  }) {
    const queryParams = {
      name: params.name,
      country_codes: params.country_codes || 'RU',
      size: params.size || 10,
    };
    const res = await this.get('/v2/location/suggest/cities', queryParams);
    return res.data;
  }

  /** /v2/location/regions */
  async getRegions(params: any) {
    const res = await this.get('/v2/location/regions', params);
    return res.data;
  }

  /** /v2/location/postalcodes */
  async getPostalCodesByCity(city_code: number) {
    const res = await this.get('/v2/location/postalcodes', { city_code });
    return res.data;
  }

  /** /v2/location/geolocation */
  async getLocationByCoordinates(latitude: number, longitude: number) {
    const res = await this.get('/v2/location/geolocation', {
      latitude,
      longitude,
    });
    return res.data;
  }

  /** /v2/location/cities (детальная инфа о населённых пунктах) */
  async getCities(params: any) {
    const res = await this.get('/v2/location/cities', params);
    return res.data;
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
    const response = await this.post(
      '/v2/calculator/tarifflist',
      calculationData,
    );
    return response.data;
  }

  private toTypeEnum(t?: string): CdekOfficeType {
    const v = (t ?? '').toString().trim().toUpperCase();
    if (v === 'PVZ') return CdekOfficeType.PVZ;
    if (v === 'POSTAMAT') return CdekOfficeType.POSTAMAT;
    return CdekOfficeType.UNKNOWN;
  }

  private toBool(v: any): boolean | null {
    if (v === true || v === 'true' || v === 1 || v === '1') return true;
    if (v === false || v === 'false' || v === 0 || v === '0') return false;
    return v == null ? null : !!v;
  }

  // ===== маппинг основной сущности =====
  private mapDeliveryPointToDb(dp: any) {
    const loc = dp.location || {};
    return {
      uuid: dp.uuid,
      code: dp.code,
      ownerCode: dp.owner_code ?? null,
      type: this.toTypeEnum(dp.type),

      countryCode: loc.country_code ?? null,
      regionCode: loc.region_code ?? null,
      cityCode: loc.city_code ?? null,
      city: loc.city ?? null,
      postalCode: loc.postal_code ?? null,

      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,

      address: loc.address ?? null,
      addressFull: loc.address_full ?? null,

      weightMin: dp.weight_min ?? null,
      weightMax: dp.weight_max ?? null,

      takeOnly: this.toBool(dp.take_only),
      isHandout: this.toBool(dp.is_handout),
      isReception: this.toBool(dp.is_reception),
      isDressingRoom: this.toBool(dp.is_dressing_room),
      isMarketplace: this.toBool(dp.is_marketplace),
      isLtl: this.toBool(dp.is_ltl),
      haveCashless: this.toBool(dp.have_cashless),
      haveCash: this.toBool(dp.have_cash),
      haveFastPaymentSystem: this.toBool(dp.have_fast_payment_system),
      allowedCod: this.toBool(dp.allowed_cod),
      fulfillment: this.toBool(dp.fulfillment),
      distance: dp.distance ?? null,

      lastSeenAt: new Date(),
      deletedAt: null,
      raw: dp,
    };
  }

  // ===== маппинг детей (нормализация) =====
  private mapChildren(dp: any) {
    const uuid = dp.uuid as string;
    const phones = (dp.phones ?? []).map((p: any) => ({
      dpUuid: uuid,
      number: p.number,
      addl: p.additional ?? null,
    }));
    const images = (dp.office_image_list ?? []).map((im: any) => ({
      dpUuid: uuid,
      number: im.number ?? null,
      url: im.url,
    }));
    const workTimes = (dp.work_time_list ?? []).map((w: any) => ({
      dpUuid: uuid,
      day: w.day,
      time: w.time,
    }));
    const exceptions = (dp.work_time_exception_list ?? []).map((e: any) => ({
      dpUuid: uuid,
      dateStart: new Date(e.date_start),
      dateEnd: new Date(e.date_end),
      timeStart: e.time_start ?? null,
      timeEnd: e.time_end ?? null,
      isWorking: !!e.is_working,
    }));
    const dimensions = (dp.dimensions ?? []).map((d: any) => ({
      dpUuid: uuid,
      width: d.width,
      height: d.height,
      depth: d.depth,
    }));
    return { phones, images, workTimes, exceptions, dimensions };
  }

  // ===== загрузка одной страницы из API =====
  private async fetchDeliveryPointsPage(
    params: any,
    page: number,
    size = 1000,
  ) {
    const p = { type: 'ALL', size, page, ...params };
    const res = await this.get('/v2/deliverypoints', p);
    return Array.isArray(res.data) ? res.data : [];
  }

  // ===== основной синк =====
  async syncDeliveryPoints(params: any = {}) {
    const overallStartTime = Date.now();
    const startedAt = new Date();
    let page = 0;
    let total = 0;
    const pageSize = 1000; // размер страницы API (максимум разумный)
    const batchSize = 100; // размер пакета для сохранения в БД
    const maxRecords = params.maxRecords || 200000; // ограничение на количество записей (по умолчанию 200к)

    this.logger.log('🚀 Начало синхронизации пунктов выдачи CDEK');
    this.logger.log(
      `⚙️  Настройки: размер страницы API=${pageSize}, размер пакета БД=${batchSize}, лимит записей=${maxRecords}`,
    );

    // Очищаем все данные
    this.logger.log('🗑️  Этап 1/2: Очистка существующих данных...');
    const cleanupStart = Date.now();
    await this.prismaService.$transaction(async (tx) => {
      await tx.cdekDPPhone.deleteMany({});
      this.logger.log('  ✓ Удалены телефоны');
      await tx.cdekDPImage.deleteMany({});
      this.logger.log('  ✓ Удалены изображения');
      await tx.cdekDPWorkTime.deleteMany({});
      this.logger.log('  ✓ Удалено расписание работы');
      await tx.cdekDPWorkTimeException.deleteMany({});
      this.logger.log('  ✓ Удалены исключения в расписании');
      await tx.cdekDPDimension.deleteMany({});
      this.logger.log('  ✓ Удалены габариты');
      await tx.cdekDeliveryPoint.deleteMany({});
      this.logger.log('  ✓ Удалены пункты выдачи');
    });
    const cleanupDuration = ((Date.now() - cleanupStart) / 1000).toFixed(2);
    this.logger.log(`✅ Очистка завершена за ${cleanupDuration}с`);

    // Загружаем и сохраняем порциями (не храним всё в памяти!)
    this.logger.log(
      '📥 Этап 2/2: Загрузка и сохранение данных (потоковая обработка)...',
    );
    const processStart = Date.now();

    while (true) {
      const pageStart = Date.now();
      this.logger.log(
        `\n  📄 Страница ${page + 1}: загрузка из CDEK API (размер: ${pageSize})...`,
      );

      const apiData = await this.fetchDeliveryPointsPage(
        params,
        page,
        pageSize,
      );
      if (!apiData.length) {
        this.logger.log(
          `  ℹ️  Страница ${page + 1} пуста - обработка завершена`,
        );
        break;
      }

      const pageDuration = ((Date.now() - pageStart) / 1000).toFixed(2);
      this.logger.log(
        `  ✓ Загружено ${apiData.length} записей за ${pageDuration}с`,
      );

      // Обрезаем данные, если превышаем лимит (ПЕРЕД сохранением!)
      const remainingSlots = maxRecords - total;
      if (remainingSlots <= 0) {
        this.logger.log(
          `  ⚠️  Достигнут лимит записей (${maxRecords}) - остановка загрузки`,
        );
        break;
      }

      const dataToSave =
        remainingSlots < apiData.length
          ? apiData.slice(0, remainingSlots)
          : apiData;
      const totalBatches = Math.ceil(dataToSave.length / batchSize);

      // Сразу сохраняем эту страницу пакетами
      this.logger.log(
        `  💾 Сохранение страницы ${page + 1} в БД пакетами по ${batchSize} (будет сохранено: ${dataToSave.length})...`,
      );

      for (let i = 0; i < dataToSave.length; i += batchSize) {
        const batchNumber = Math.floor(i / batchSize) + 1;
        const batchStart = Date.now();
        const batch = dataToSave.slice(i, i + batchSize);

        await this.prismaService.$transaction(async (tx) => {
          const deliveryPointsData: any[] = [];
          const phonesData: any[] = [];
          const imagesData: any[] = [];
          const workTimesData: any[] = [];
          const exceptionsData: any[] = [];
          const dimensionsData: any[] = [];

          for (const dp of batch) {
            const base = this.mapDeliveryPointToDb(dp);
            deliveryPointsData.push(base);

            const ch = this.mapChildren(dp);
            phonesData.push(...ch.phones);
            imagesData.push(...ch.images);
            workTimesData.push(...ch.workTimes);
            exceptionsData.push(...ch.exceptions);
            dimensionsData.push(...ch.dimensions);
          }

          // Массовые вставки (skipDuplicates для избежания конфликтов)
          if (deliveryPointsData.length)
            await tx.cdekDeliveryPoint.createMany({
              data: deliveryPointsData,
              skipDuplicates: true,
            });
          if (phonesData.length)
            await tx.cdekDPPhone.createMany({
              data: phonesData,
              skipDuplicates: true,
            });
          if (imagesData.length)
            await tx.cdekDPImage.createMany({
              data: imagesData,
              skipDuplicates: true,
            });
          if (workTimesData.length)
            await tx.cdekDPWorkTime.createMany({
              data: workTimesData,
              skipDuplicates: true,
            });
          if (exceptionsData.length)
            await tx.cdekDPWorkTimeException.createMany({
              data: exceptionsData,
              skipDuplicates: true,
            });
          if (dimensionsData.length)
            await tx.cdekDPDimension.createMany({
              data: dimensionsData,
              skipDuplicates: true,
            });
        });

        total += batch.length;
        const batchDuration = ((Date.now() - batchStart) / 1000).toFixed(2);
        this.logger.log(
          `    ✓ Пакет ${batchNumber}/${totalBatches}: сохранено ${batch.length} записей за ${batchDuration}с (всего: ${total})`,
        );
      }

      const pageFullDuration = ((Date.now() - pageStart) / 1000).toFixed(2);
      this.logger.log(
        `  ✅ Страница ${page + 1} полностью обработана за ${pageFullDuration}с`,
      );

      page += 1;

      // Если достигли лимита, выходим
      if (total >= maxRecords) {
        this.logger.log(
          `  ⚠️  Достигнут лимит записей (${maxRecords}) - остановка`,
        );
        break;
      }

      // Небольшая пауза между страницами
      await new Promise((r) => setTimeout(r, 150));
    }

    const processDuration = ((Date.now() - processStart) / 1000).toFixed(2);
    const totalDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);
    const avgSpeed = total / (Number(processDuration) / 60);

    this.logger.log(`\n🎉 Синхронизация успешно завершена!`);
    this.logger.log(`   📊 Создано записей: ${total}`);
    this.logger.log(`   📄 Обработано страниц: ${page}`);
    this.logger.log(
      `   ⏱️  Общее время: ${totalDuration}с (очистка: ${cleanupDuration}с, обработка: ${processDuration}с)`,
    );
    this.logger.log(
      `   ⚡ Средняя скорость: ${avgSpeed.toFixed(0)} записей/мин`,
    );

    return { created: total, removed: 0 };
  }

  // ===== чтение с фильтрами и bbox =====
  async listFromDb(opts: {
    type?: 'PVZ' | 'POSTAMAT' | 'UNKNOWN';
    city_code?: number;
    q?: string;
    lat_min?: number;
    lat_max?: number;
    lon_min?: number;
    lon_max?: number;
    limit?: number;
    offset?: number;
  }) {
    const {
      type,
      city_code,
      q,
      lat_min,
      lat_max,
      lon_min,
      lon_max,
      limit = 100,
      offset = 0,
    } = opts;

    const where: any = { deletedAt: null };
    if (type) where.type = type;
    if (city_code != null) where.cityCode = Number(city_code);
    if (q)
      where.OR = [
        { address: { contains: q, mode: 'insensitive' } },
        { addressFull: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
      ];
    if (
      [lat_min, lat_max, lon_min, lon_max].every((v) => typeof v === 'number')
    ) {
      // Автоматически меняем местами min/max, если перепутаны
      const actualLatMin = Math.min(lat_min!, lat_max!);
      const actualLatMax = Math.max(lat_min!, lat_max!);
      const actualLonMin = Math.min(lon_min!, lon_max!);
      const actualLonMax = Math.max(lon_min!, lon_max!);

      where.AND = [
        { latitude: { gte: actualLatMin } },
        { latitude: { lte: actualLatMax } },
        { longitude: { gte: actualLonMin } },
        { longitude: { lte: actualLonMax } },
      ];
    }

    const [rows, total] = await this.prismaService.$transaction([
      this.prismaService.cdekDeliveryPoint.findMany({
        where,
        orderBy: [{ cityCode: 'asc' }, { type: 'asc' }, { code: 'asc' }],
        take: Math.min(Number(limit), 1000),
        skip: Number(offset),
        include: {
          phones: true,
          images: true,
          workTimes: true,
          exceptions: true,
          dimensions: true,
        },
      }),
      this.prismaService.cdekDeliveryPoint.count({ where }),
    ]);
    return { total, rows };
  }

  // ===== поиск по радиусу (PostGIS быстрая ветка) =====
  async listWithinRadiusPostGIS(
    center_lat: number,
    center_lon: number,
    radius_km: number,
    limit = 100,
    offset = 0,
  ) {
    const meters = radius_km * 1000;
    // distance_m вернём наружу, чтобы сортировать
    const rows: any[] = await this.prismaService.$queryRaw`
    SELECT *, 
      ST_Distance("geo", ST_SetSRID(ST_MakePoint(${center_lon}, ${center_lat}),4326)::geography) AS distance_m
    FROM "CdekDeliveryPoint"
    WHERE "deletedAt" IS NULL
      AND "geo" IS NOT NULL
      AND ST_DWithin("geo", ST_SetSRID(ST_MakePoint(${center_lon}, ${center_lat}),4326)::geography, ${meters})
    ORDER BY distance_m ASC
    LIMIT ${limit} OFFSET ${offset};
  `;
    // total (примерно) посчитаем отдельным запросом
    const [{ count }]: any = await this.prismaService.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "CdekDeliveryPoint"
    WHERE "deletedAt" IS NULL
      AND "geo" IS NOT NULL
      AND ST_DWithin("geo", ST_SetSRID(ST_MakePoint(${center_lon}, ${center_lat}),4326)::geography, ${meters});
  `;
    return { total: count, rows };
  }

  // ===== поиск по радиусу (fallback без PostGIS, Haversine) =====
  async listWithinRadiusHaversine(
    center_lat: number,
    center_lon: number,
    radius_km: number,
    limit = 100,
    offset = 0,
  ) {
    // сначала узкий bbox (для ускорения), потом точная формула
    const dLat = radius_km / 111.32;
    const dLon = radius_km / (111.32 * Math.cos((center_lat * Math.PI) / 180));
    const latMin = center_lat - dLat,
      latMax = center_lat + dLat;
    const lonMin = center_lon - dLon,
      lonMax = center_lon + dLon;

    const rows: any[] = await this.prismaService.$queryRaw`
    SELECT *,
      (6371 * acos(
        cos(radians(${center_lat})) * cos(radians("latitude")) *
        cos(radians("longitude") - radians(${center_lon})) +
        sin(radians(${center_lat})) * sin(radians("latitude"))
      )) AS distance_km
    FROM "CdekDeliveryPoint"
    WHERE "deletedAt" IS NULL
      AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
      AND "latitude" BETWEEN ${latMin} AND ${latMax}
      AND "longitude" BETWEEN ${lonMin} AND ${lonMax}
    ORDER BY distance_km ASC
    LIMIT ${limit} OFFSET ${offset};
  `;

    const [{ count }]: any = await this.prismaService.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "CdekDeliveryPoint"
    WHERE "deletedAt" IS NULL
      AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
      AND "latitude" BETWEEN ${latMin} AND ${latMax}
      AND "longitude" BETWEEN ${lonMin} AND ${lonMax}
      AND (6371 * acos(
        cos(radians(${center_lat})) * cos(radians("latitude")) *
        cos(radians("longitude") - radians(${center_lon})) +
        sin(radians(${center_lat})) * sin(radians("latitude"))
      )) <= ${radius_km};
  `;
    return { total: count, rows };
  }

  async registerOrder(dto: CreateCdekOrderDto) {
    // 1) Вызов внешнего API
    const plain = JSON.parse(JSON.stringify(dto));
    const payload = this._cleanPayload(plain);

    // 👇 Жёсткий хотфикс: гарантированно непустой comment у каждого пакета
    if (Array.isArray(payload.packages)) {
      payload.packages = payload.packages.map((p: any) => {
        if (!p) return p;
        if (
          !('comment' in p) ||
          p.comment === null ||
          (typeof p.comment === 'string' && p.comment.trim() === '')
        ) {
          p.comment = '-'; // ставим непустое значение
        }
        return p;
      });
    }

    // Лог: что именно улетает
    this.logger.debug(
      'Outbound payload.packages[0]: ' +
        JSON.stringify(payload?.packages?.[0], null, 2),
    );

    // developer-key в заголовки при необходимости
    const headers: Record<string, string> = {};

    // Отправка
    const apiResponse: any = await this.post('/v2/orders', payload, headers);

    const entityUuid: string | undefined = apiResponse?.entity?.uuid;
    const requests = Array.isArray(apiResponse?.requests)
      ? apiResponse.requests
      : [];
    const related = Array.isArray(apiResponse?.related_entities)
      ? apiResponse.related_entities
      : [];

    // 2) Подготовка «шапки» заказа для БД
    const head: Prisma.CdekOrderCreateInput = {
      uuid: entityUuid ?? null,
      type: Number(dto.type),
      additionalTypes: Array.isArray(dto.additional_order_types)
        ? dto.additional_order_types
        : [],
      number: dto.number ?? null,
      accompanyingNumber: dto.accompanying_number ?? null,
      tariffCode: Number(dto.tariff_code),
      comment: dto.comment ?? null,
      shipmentPoint: dto.shipment_point ?? null,
      deliveryPoint: dto.delivery_point ?? null,
      dateInvoice: dto.date_invoice ? new Date(dto.date_invoice) : null,
      shipperName: dto.shipper_name ?? null,
      shipperAddress: dto.shipper_address ?? null,

      isClientReturn:
        typeof dto.is_client_return === 'boolean' ? dto.is_client_return : null,
      hasReverseOrder:
        typeof dto.has_reverse_order === 'boolean'
          ? dto.has_reverse_order
          : null,

      developerKey: dto.developer_key ?? null,
      printType: dto.print ?? null,
      widgetToken: dto.widget_token ?? null,

      // JSON-поля — через _j(), чтобы не класть null
      senderJson: this._j(dto.sender),
      recipientJson: this._j(dto.recipient),
      fromLocationJson: this._j(dto.from_location),
      toLocationJson: this._j(dto.to_location),
      servicesJson: this._j(dto.services),

      // обязательные JSON — тут точно не null
      rawRequest: dto as unknown as Prisma.InputJsonValue,
      rawResponse: apiResponse as unknown as Prisma.InputJsonValue,

      requestState: requests[0]?.state ?? null,
      statusNote: requests[0]?.type ?? null,
    };

    const packages = Array.isArray(dto.packages) ? dto.packages : [];

    // 3) Сохранение всего в транзакции
    const savedOrder = await this.prismaService.$transaction(async (tx) => {
      // 3.1 Шапка заказа
      const order = await tx.cdekOrder.create({ data: head });

      // 3.2 Пакеты
      for (const p of packages) {
        const pkg = await tx.cdekOrderPackage.create({
          data: {
            orderId: order.id,
            number: p?.number ?? null,
            weight: this._n(p?.weight),
            length: this._n(p?.length),
            width: this._n(p?.width),
            height: this._n(p?.height),
            comment: p?.comment ?? null,
            packageId: p?.package_id ?? null,
          },
        });

        // 3.3 Товары в пакете
        const items = Array.isArray(p?.items) ? p.items : [];
        if (items.length) {
          await tx.cdekOrderItem.createMany({
            data: items.map((it) => ({
              packageId: pkg.id,
              name: it?.name ?? null,
              wareKey: it?.ware_key ?? null,
              marking: it?.marking ?? null,
              payment: this._j(it?.payment),
              weight: this._n(it?.weight),
              weightGross: this._n(it?.weight_gross),
              amount: this._n(it?.amount),
              nameI18n: it?.name_i18n ?? null,
              brand: it?.brand ?? null,
              countryCode: it?.country_code ?? null,
              material: it?.material ?? null,
              wifiGsm: typeof it?.wifi_gsm === 'boolean' ? it.wifi_gsm : null,
              url: it?.url ?? null,
              sellerJson: this._j(it?.seller),
              cost: this._n(it?.cost),
              feacnCode: it?.feacn_code ?? null,
              jewelUin: it?.jewel_uin ?? null,
              used: typeof it?.used === 'boolean' ? it.used : null,
            })),
          });
        }
      }

      // 3.4 Журнал requests из ответа
      if (requests.length) {
        await tx.cdekOrderRequest.createMany({
          data: requests.map((r: any) => ({
            orderId: order.id,
            requestUuid: r?.request_uuid ?? null,
            type: r?.type ?? null,
            dateTime: r?.date_time ? new Date(r.date_time) : null,
            state: r?.state ?? null,
            errorsJson: this._j(r?.errors),
            warningsJson: this._j(r?.warnings),
          })),
        });
      }

      // 3.5 Связанные сущности related_entities
      if (related.length) {
        await tx.cdekOrderRelated.createMany({
          data: related.map((re: any) => ({
            orderId: order.id,
            uuid: re?.uuid ?? null,
            type: re?.type ?? null,
            url: re?.url ?? null,
            createTime: re?.create_time ? new Date(re.create_time) : null,
            cdekNumber: re?.cdek_number ?? null,
            date: re?.date ? new Date(re.date) : null,
            timeFrom: re?.time_from ?? null,
            timeTo: re?.time_to ?? null,
          })),
        });

        // Если появился cdek_number — обновим шапку
        const firstCdekNumber = related.find(
          (x: any) => x?.cdek_number,
        )?.cdek_number;
        if (firstCdekNumber) {
          await tx.cdekOrder.update({
            where: { id: order.id },
            data: { cdekNumber: firstCdekNumber },
          });
        }
      }

      return order;
    });

    // 4) Запускаем фоновое обновление информации о заказе (не блокируем ответ)
    if (entityUuid) {
      // Запускаем асинхронное обновление в фоне
      this.scheduleOrderUpdate(savedOrder.id, entityUuid).catch((err) => {
        this.logger.error(
          `Фоновое обновление заказа ${entityUuid} завершилось с ошибкой:`,
          err.message,
        );
      });
    }

    return {
      ...apiResponse,
      local: {
        orderId: savedOrder.id,
        uuid: savedOrder.uuid,
        cdekNumber: savedOrder.cdekNumber,
      },
    };
  }

  /**
   * Фоновое обновление информации о заказе с retry-логикой
   * Проверяет заказ через 5, 10, 20 и 30 секунд после создания
   */
  private async scheduleOrderUpdate(orderId: number, uuid: string) {
    const delays = [5000, 10000, 20000, 30000]; // 5, 10, 20, 30 секунд
    const maxAttempts = 4;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const delay = delays[attempt];

      // Ждем указанное время
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        this.logger.log(
          `[Попытка ${attempt + 1}/${maxAttempts}] Обновление заказа ${uuid} через ${delay / 1000}с...`,
        );

        // Получаем актуальную информацию из CDEK API
        const fullOrderInfo = await this.getOrder(uuid);
        const cdekNumber = fullOrderInfo?.entity?.cdek_number;
        const statuses = Array.isArray(fullOrderInfo?.entity?.statuses)
          ? fullOrderInfo.entity.statuses
          : [];

        // Если получили cdek_number - обновляем БД и завершаем попытки
        if (cdekNumber) {
          await this.prismaService.cdekOrder.update({
            where: { id: orderId },
            data: {
              cdekNumber: cdekNumber,
              rawResponse: fullOrderInfo as unknown as Prisma.InputJsonValue,
              requestState: fullOrderInfo?.requests?.[0]?.state ?? undefined,
              statusNote: statuses[0]?.code ?? undefined,
            },
          });

          this.logger.log(
            `✅ Заказ ${uuid} успешно обновлен: cdek_number=${cdekNumber}, статусов=${statuses.length}`,
          );
          return; // Успешно получили cdek_number, выходим
        } else {
          this.logger.warn(
            `⏳ Попытка ${attempt + 1}: cdek_number еще не присвоен для заказа ${uuid}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `❌ Ошибка при обновлении заказа ${uuid} (попытка ${attempt + 1}):`,
          error.message,
        );
      }
    }

    this.logger.warn(
      `⚠️  Заказ ${uuid} не получил cdek_number после ${maxAttempts} попыток`,
    );
  }

  /**
   * Быстрый геттер: заказ из БД по uuid (для внутренней диагностики/отладки UI)
   */
  async getOrderFromDbByUuid(uuid: string) {
    return this.prismaService.cdekOrder.findFirst({
      where: { uuid },
      include: {
        packages: { include: { items: true } },
        requests: true,
        relatedEntities: true,
      },
    });
  }

  /**
   * Быстрый геттер: заказ из БД по локальному ID
   */
  async getOrderFromDbById(id: number) {
    return this.prismaService.cdekOrder.findUnique({
      where: { id },
      include: {
        packages: { include: { items: true } },
        requests: true,
        relatedEntities: true,
      },
    });
  }

  /**
   * Получение списка заказов из БД с пагинацией и фильтрацией
   */
  async getOrdersList(
    params: {
      limit?: number;
      offset?: number;
      dateFrom?: Date;
      dateTo?: Date;
      tariffCode?: number;
    } = {},
  ) {
    const { limit = 50, offset = 0, dateFrom, dateTo, tariffCode } = params;

    const where: any = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) {
        // Устанавливаем конец дня для dateTo
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    if (tariffCode !== undefined && tariffCode !== null) {
      where.tariffCode = Number(tariffCode);
    }

    const [orders, total] = await this.prismaService.$transaction([
      this.prismaService.cdekOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
        include: {
          packages: {
            include: {
              items: true,
            },
          },
          requests: true,
          relatedEntities: true,
        },
      }),
      this.prismaService.cdekOrder.count({ where }),
    ]);

    return { total, orders };
  }

  // ------- МАЛЕНЬКИЕ ХЕЛПЕРЫ ВНИЗ СЕРВИСА -------

  /** Приводит значение к number | null */
  private _n(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private _j(v: any): Prisma.InputJsonValue | undefined {
    return v === null || v === undefined
      ? undefined
      : (v as Prisma.InputJsonValue);
  }

  private _cleanPayload<T = any>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj
        .map((v) => this._cleanPayload(v))
        .filter((v) => v !== undefined) as any;
    }
    if (typeof obj === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(obj)) {
        const cleaned = this._cleanPayload(v);
        // удаляем пустые строки, null, undefined
        if (
          cleaned === undefined ||
          cleaned === null ||
          (typeof cleaned === 'string' && cleaned.trim() === '')
        )
          continue;
        out[k] = cleaned;
      }
      return out;
    }
    return obj as any;
  }

  /**
   * Формирование и получение накладной к заказу
   * Этот метод объединяет два запроса:
   * 1. POST /v2/print/orders - формирование накладной
   * 2. GET /v2/print/orders/{uuid} - получение статуса и ссылки на скачивание
   */
  async printWaybill(
    dto: PrintWaybillRequestDto,
  ): Promise<WaybillDto & { url?: string }> {
    this.logger.log('Запрос на формирование накладной к заказу');

    // Валидация: не более 100 заказов
    if (dto.orders.length > 100) {
      throw new HttpException(
        'Нельзя передавать более 100 номеров заказов в одном запросе',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Валидация: у каждого заказа должен быть order_uuid или cdek_number
    for (const order of dto.orders) {
      if (!order.order_uuid && !order.cdek_number) {
        throw new HttpException(
          'Для каждого заказа необходимо указать order_uuid или cdek_number',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      // Шаг 1: Формирование накладной
      this.logger.log('Отправка запроса на формирование накладной');
      const createResponse = await this.post('/v2/print/orders', {
        orders: dto.orders,
        copy_count: dto.orders[0]?.copy_count || 2,
        type: dto.type || 'tpl_russia',
      });

      const waybillUuid = createResponse?.entity?.uuid;
      if (!waybillUuid) {
        throw new HttpException(
          'Не удалось получить UUID накладной из ответа CDEK',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`Накладная создана с UUID: ${waybillUuid}`);

      // Шаг 2: Polling статуса накладной (максимум 30 попыток с интервалом 2 секунды)
      const maxAttempts = 30;
      const pollInterval = 2000; // 2 секунды

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.logger.log(
          `Проверка статуса накладной (попытка ${attempt}/${maxAttempts})`,
        );

        // Задержка перед следующей проверкой (кроме первой попытки)
        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        // Получение статуса накладной
        const statusResponse: any = await this.get(
          `/v2/print/orders/${waybillUuid}`,
        );
        const entity = statusResponse?.data?.entity;

        if (!entity) {
          this.logger.warn('Не удалось получить информацию о накладной');
          continue;
        }

        const statuses = entity.statuses || [];
        const currentStatus = statuses[statuses.length - 1]?.code;

        this.logger.log(`Текущий статус накладной: ${currentStatus}`);

        // Обработка различных статусов
        switch (currentStatus) {
          case 'READY':
            // Накладная готова, скачиваем PDF
            this.logger.log('Накладная успешно сформирована, скачиваем PDF...');

            try {
              // Скачиваем PDF файл
              const pdfUrl = `https://api.edu.cdek.ru/v2/print/orders/${waybillUuid}.pdf`;
              const pdfResponse = await this.apiClient.get(pdfUrl, {
                responseType: 'arraybuffer',
                headers: {
                  Authorization: `${this.currentToken!.token_type} ${this.currentToken!.access_token}`,
                },
              });

              const pdfBuffer = Buffer.from(pdfResponse.data);
              this.logger.log(
                `PDF скачан успешно, размер: ${pdfBuffer.length} байт`,
              );

              return {
                ...entity,
                url: entity.url,
                pdfBuffer: pdfBuffer,
                pdfBase64: pdfBuffer.toString('base64'),
              };
            } catch (pdfError) {
              this.logger.error('Ошибка при скачивании PDF:', pdfError.message);
              // Возвращаем хотя бы URL, если скачивание не удалось
              return {
                ...entity,
                url: entity.url,
              };
            }

          case 'INVALID':
            // Некорректный запрос
            throw new HttpException(
              'Некорректный запрос на формирование накладной',
              HttpStatus.BAD_REQUEST,
            );

          case 'REMOVED':
            // Истекло время жизни
            throw new HttpException(
              'Истекло время жизни ссылки на накладную',
              HttpStatus.GONE,
            );

          case 'ACCEPTED':
          case 'PROCESSING':
            // Продолжаем ждать
            this.logger.log('Накладная формируется, ожидаем...');
            break;

          default:
            this.logger.warn(`Неизвестный статус: ${currentStatus}`);
        }
      }

      // Если за 30 попыток не получили готовый статус
      throw new HttpException(
        'Превышено время ожидания формирования накладной',
        HttpStatus.REQUEST_TIMEOUT,
      );
    } catch (error) {
      this.logger.error('Ошибка при формировании накладной:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Не удалось сформировать накладную: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Формирование и получение ШК места к заказу
   * Этот метод объединяет два запроса:
   * 1. POST /v2/print/barcodes - формирование ШК места
   * 2. GET /v2/print/barcodes/{uuid} - получение статуса и ссылки на скачивание
   */
  async printBarcode(
    dto: PrintBarcodeRequestDtoV2,
  ): Promise<BarcodeDto & { url?: string }> {
    this.logger.log('Запрос на формирование ШК места к заказу');

    // Валидация: не более 100 заказов
    if (dto.orders.length > 100) {
      throw new HttpException(
        'Нельзя передавать более 100 номеров заказов в одном запросе',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Валидация: у каждого заказа должен быть order_uuid или cdek_number
    for (const order of dto.orders) {
      if (!order.order_uuid && !order.cdek_number) {
        throw new HttpException(
          'Для каждого заказа необходимо указать order_uuid или cdek_number',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    try {
      // Шаг 1: Формирование ШК места
      this.logger.log('Отправка запроса на формирование ШК места');
      const createResponse = await this.post('/v2/print/barcodes', {
        orders: dto.orders,
        copy_count: dto.copy_count || 1,
        format: dto.format || 'A4',
        lang: dto.lang || 'RUS',
      });

      const barcodeUuid = createResponse?.entity?.uuid;
      if (!barcodeUuid) {
        throw new HttpException(
          'Не удалось получить UUID ШК места из ответа CDEK',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.log(`ШК места создан с UUID: ${barcodeUuid}`);

      // Шаг 2: Polling статуса ШК места (максимум 30 попыток с интервалом 2 секунды)
      const maxAttempts = 30;
      const pollInterval = 2000; // 2 секунды

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        this.logger.log(
          `Проверка статуса ШК места (попытка ${attempt}/${maxAttempts})`,
        );

        // Задержка перед следующей проверкой (кроме первой попытки)
        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        // Получение статуса ШК места
        const statusResponse: any = await this.get(
          `/v2/print/barcodes/${barcodeUuid}`,
        );
        const entity = statusResponse?.data?.entity;

        if (!entity) {
          this.logger.warn('Не удалось получить информацию о ШК места');
          continue;
        }

        const statuses = entity.statuses || [];
        const currentStatus = statuses[statuses.length - 1]?.code;

        this.logger.log(`Текущий статус ШК места: ${currentStatus}`);

        // Обработка различных статусов
        switch (currentStatus) {
          case 'READY':
            // ШК места готов, скачиваем PDF
            this.logger.log('ШК места успешно сформирован, скачиваем PDF...');

            try {
              // Скачиваем PDF файл
              const pdfUrl = `https://api.edu.cdek.ru/v2/print/barcodes/${barcodeUuid}.pdf`;
              const pdfResponse = await this.apiClient.get(pdfUrl, {
                responseType: 'arraybuffer',
                headers: {
                  Authorization: `${this.currentToken!.token_type} ${this.currentToken!.access_token}`,
                },
              });

              const pdfBuffer = Buffer.from(pdfResponse.data);
              this.logger.log(
                `PDF ШК места скачан успешно, размер: ${pdfBuffer.length} байт`,
              );

              return {
                ...entity,
                url: entity.url,
                pdfBuffer: pdfBuffer,
                pdfBase64: pdfBuffer.toString('base64'),
              };
            } catch (pdfError) {
              this.logger.error(
                'Ошибка при скачивании PDF ШК места:',
                pdfError.message,
              );
              // Возвращаем хотя бы URL, если скачивание не удалось
              return {
                ...entity,
                url: entity.url,
              };
            }

          case 'INVALID':
            // Некорректный запрос
            throw new HttpException(
              'Некорректный запрос на формирование ШК места',
              HttpStatus.BAD_REQUEST,
            );

          case 'REMOVED':
            // Истекло время жизни
            throw new HttpException(
              'Истекло время жизни ссылки на ШК места',
              HttpStatus.GONE,
            );

          case 'ACCEPTED':
          case 'PROCESSING':
            // Продолжаем ждать
            this.logger.log('ШК места формируется, ожидаем...');
            break;

          default:
            this.logger.warn(`Неизвестный статус ШК места: ${currentStatus}`);
        }
      }

      // Если за 30 попыток не получили готовый статус
      throw new HttpException(
        'Превышено время ожидания формирования ШК места',
        HttpStatus.REQUEST_TIMEOUT,
      );
    } catch (error) {
      this.logger.error('Ошибка при формировании ШК места:', error.message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Не удалось сформировать ШК места: ${error.message}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
