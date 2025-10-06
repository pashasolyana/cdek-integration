import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { CdekAuthDto, CdekTokenResponse } from './dto/auth.dto';
import { CalcTariffListRequestDto, CalcTariffListResponseDto } from './dto/calculator.dto';
import { Prisma, CdekOfficeType } from '@prisma/client';
import { CreateCdekOrderDto } from './dto/create-cdek-order.dto';
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

protected async post<T = any>(path: string, data?: any, headers: Record<string, string> = {}): Promise<T> {
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
    this.logger.error(`[CDEK POST ${path}] ${status}`, JSON.stringify(payload, null, 2));
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

  async calculateTariffList(body: CalcTariffListRequestDto) {
     const response = await this.post('/v2/calculator/tarifflist', body);
  return response.data as CalcTariffListResponseDto;
  }

  /** /v2/location/suggest/cities */
async suggestCities(params: { name: string; country_code?: string }) {
  const res = await this.get('/v2/location/suggest/cities', params);
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
  const res = await this.get('/v2/location/geolocation', { latitude, longitude });
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
    const response = await this.post('/v2/calculator/tarifflist', calculationData);
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
  const phones = (dp.phones ?? []).map((p:any)=>({ dpUuid: uuid, number: p.number, addl: p.additional ?? null }));
  const images = (dp.office_image_list ?? []).map((im:any)=>({ dpUuid: uuid, number: im.number ?? null, url: im.url }));
  const workTimes = (dp.work_time_list ?? []).map((w:any)=>({ dpUuid: uuid, day: w.day, time: w.time }));
  const exceptions = (dp.work_time_exception_list ?? []).map((e:any)=>({
    dpUuid: uuid,
    dateStart: new Date(e.date_start),
    dateEnd: new Date(e.date_end),
    timeStart: e.time_start ?? null,
    timeEnd: e.time_end ?? null,
    isWorking: !!e.is_working,
  }));
  const dimensions = (dp.dimensions ?? []).map((d:any)=>({ dpUuid: uuid, width: d.width, height: d.height, depth: d.depth }));
  return { phones, images, workTimes, exceptions, dimensions };
}

// ===== загрузка одной страницы из API =====
private async fetchDeliveryPointsPage(params: any, page: number, size = 1000) {
  const p = { type: 'ALL', size, page, ...params };
  const res = await this.get('/v2/deliverypoints', p);
  return Array.isArray(res.data) ? res.data : [];
}

// ===== основной синк =====
async syncDeliveryPoints(params: any = {}) {
  const startedAt = new Date();
  let page = 0;
  let total = 0;
  const size = Number(params.size ?? 1000);

  while (true) {
    const batch = await this.fetchDeliveryPointsPage(params, page, size);
    if (!batch.length) break;

    // upsert основного + перезалив детей
    for (const dp of batch) {
      const base = this.mapDeliveryPointToDb(dp);
      await this.prismaService.$transaction(async (tx) => {
        await tx.cdekDeliveryPoint.upsert({
          where: { uuid: base.uuid },
          create: base,
          update: base,
        });
        // зачистка детей (проще и безопасно для тестов)
        await tx.cdekDPPhone.deleteMany({ where: { dpUuid: base.uuid } });
        await tx.cdekDPImage.deleteMany({ where: { dpUuid: base.uuid } });
        await tx.cdekDPWorkTime.deleteMany({ where: { dpUuid: base.uuid } });
        await tx.cdekDPWorkTimeException.deleteMany({ where: { dpUuid: base.uuid } });
        await tx.cdekDPDimension.deleteMany({ where: { dpUuid: base.uuid } });

        const ch = this.mapChildren(dp);
        if (ch.phones.length)      await tx.cdekDPPhone.createMany({ data: ch.phones, skipDuplicates: true });
        if (ch.images.length)      await tx.cdekDPImage.createMany({ data: ch.images, skipDuplicates: true });
        if (ch.workTimes.length)   await tx.cdekDPWorkTime.createMany({ data: ch.workTimes, skipDuplicates: true });
        if (ch.exceptions.length)  await tx.cdekDPWorkTimeException.createMany({ data: ch.exceptions, skipDuplicates: true });
        if (ch.dimensions.length)  await tx.cdekDPDimension.createMany({ data: ch.dimensions, skipDuplicates: true });
      });
    }

    total += batch.length;
    page += 1;
    await new Promise(r => setTimeout(r, 150));
  }

  const { count: removed } = await this.prismaService.cdekDeliveryPoint.updateMany({
    where: { deletedAt: null, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: startedAt } }] },
    data: { deletedAt: new Date() },
  });

  return { upserted: total, removed };
}

// ===== чтение с фильтрами и bbox =====
async listFromDb(opts: {
  type?: 'PVZ'|'POSTAMAT'|'UNKNOWN';
  city_code?: number;
  q?: string;
  lat_min?: number; lat_max?: number;
  lon_min?: number; lon_max?: number;
  limit?: number; offset?: number;
}) {
  const { type, city_code, q, lat_min, lat_max, lon_min, lon_max, limit=100, offset=0 } = opts;

  const where: any = { deletedAt: null };
  if (type) where.type = type;
  if (city_code != null) where.cityCode = Number(city_code);
  if (q) where.OR = [
    { address: { contains: q, mode: 'insensitive' } },
    { addressFull: { contains: q, mode: 'insensitive' } },
    { code: { contains: q, mode: 'insensitive' } },
    { city: { contains: q, mode: 'insensitive' } },
  ];
  if ([lat_min,lat_max,lon_min,lon_max].every(v => typeof v === 'number')) {
    where.AND = [
      { latitude:  { gte: lat_min } },
      { latitude:  { lte: lat_max } },
      { longitude: { gte: lon_min } },
      { longitude: { lte: lon_max } },
    ];
  }

  const [rows, total] = await this.prismaService.$transaction([
    this.prismaService.cdekDeliveryPoint.findMany({
      where,
      orderBy: [{ cityCode: 'asc' }, { type: 'asc' }, { code: 'asc' }],
      take: Math.min(Number(limit), 1000),
      skip: Number(offset),
      include: { phones: true, images: true, workTimes: true, exceptions: true, dimensions: true },
    }),
    this.prismaService.cdekDeliveryPoint.count({ where }),
  ]);
  return { total, rows };
}

// ===== поиск по радиусу (PostGIS быстрая ветка) =====
async listWithinRadiusPostGIS(center_lat: number, center_lon: number, radius_km: number, limit=100, offset=0) {
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
async listWithinRadiusHaversine(center_lat: number, center_lon: number, radius_km: number, limit=100, offset=0) {
  // сначала узкий bbox (для ускорения), потом точная формула
  const dLat = radius_km / 111.32;
  const dLon = radius_km / (111.32 * Math.cos(center_lat * Math.PI/180));
  const latMin = center_lat - dLat, latMax = center_lat + dLat;
  const lonMin = center_lon - dLon, lonMax = center_lon + dLon;

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
let payload = this._cleanPayload(plain);

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
  'Outbound payload.packages[0]: ' + JSON.stringify(payload?.packages?.[0], null, 2),
);

// developer-key в заголовки при необходимости
const headers: Record<string, string> = {};


// Отправка
const apiResponse: any = await this.post('/v2/orders', payload, headers);


    const entityUuid: string | undefined = apiResponse?.entity?.uuid;
    const requests = Array.isArray(apiResponse?.requests) ? apiResponse.requests : [];
    const related = Array.isArray(apiResponse?.related_entities) ? apiResponse.related_entities : [];

    // 2) Подготовка «шапки» заказа для БД
    const head: Prisma.CdekOrderCreateInput = {
      uuid: entityUuid ?? null,
      type: Number(dto.type),
      additionalTypes: Array.isArray(dto.additional_order_types) ? dto.additional_order_types : [],
      number: dto.number ?? null,
      accompanyingNumber: dto.accompanying_number ?? null,
      tariffCode: Number(dto.tariff_code),
      comment: dto.comment ?? null,
      shipmentPoint: dto.shipment_point ?? null,
      deliveryPoint: dto.delivery_point ?? null,
      dateInvoice: dto.date_invoice ? new Date(dto.date_invoice) : null,
      shipperName: dto.shipper_name ?? null,
      shipperAddress: dto.shipper_address ?? null,

      isClientReturn: typeof dto.is_client_return === 'boolean' ? dto.is_client_return : null,
      hasReverseOrder: typeof dto.has_reverse_order === 'boolean' ? dto.has_reverse_order : null,

      developerKey: dto.developer_key ?? null,
      printType: dto.print ?? null,
      widgetToken: dto.widget_token ?? null,

      // JSON-поля — через _j(), чтобы не класть null
      senderJson:        this._j(dto.sender),
      recipientJson:     this._j(dto.recipient),
      fromLocationJson:  this._j(dto.from_location),
      toLocationJson:    this._j(dto.to_location),
      servicesJson:      this._j(dto.services),

      // обязательные JSON — тут точно не null
      rawRequest:  dto as unknown as Prisma.InputJsonValue,
      rawResponse: apiResponse as unknown as Prisma.InputJsonValue,

      requestState: requests[0]?.state ?? null,
      statusNote:   requests[0]?.type ?? null,
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
            width:  this._n(p?.width),
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
        const firstCdekNumber = related.find((x: any) => x?.cdek_number)?.cdek_number;
        if (firstCdekNumber) {
          await tx.cdekOrder.update({
            where: { id: order.id },
            data: { cdekNumber: firstCdekNumber },
          });
        }
      }

      return order;
    });

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

// ------- МАЛЕНЬКИЕ ХЕЛПЕРЫ ВНИЗ СЕРВИСА -------

/** Приводит значение к number | null */
private _n(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

private _j(v: any): Prisma.InputJsonValue | undefined {
  return v === null || v === undefined ? undefined : (v as Prisma.InputJsonValue);
}

private _cleanPayload<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj as T;
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
      ) continue;
      out[k] = cleaned;
    }
    return out;
  }
  return obj as any;
}
}