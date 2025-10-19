import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Сервис для работы с API Dadata
 * 
 * Документация:
 * - Подсказки: https://dadata.ru/api/suggest/address/
 * - Стандартизация: https://dadata.ru/api/clean/address/
 * 
 * API Endpoints:
 * - Подсказки: POST https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address
 * - Стандартизация: POST https://cleaner.dadata.ru/api/v1/clean/address
 */
@Injectable()
export class DadataService {
  private readonly logger = new Logger(DadataService.name);
  private readonly suggestClient: AxiosInstance;
  private readonly cleanClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('DADATA_API_TOKEN') || '';
    this.secretKey = this.configService.get<string>('DADATA_SECRET_KEY') || '';

    if (!this.apiKey) {
      this.logger.warn('⚠️  DADATA_API_TOKEN не настроен в .env');
    }
    if (!this.secretKey) {
      this.logger.warn('⚠️  DADATA_SECRET_KEY не настроен (нужен для стандартизации)');
    }

    // Клиент для подсказок
    this.suggestClient = axios.create({
      baseURL: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    // Клиент для стандартизации
    this.cleanClient = axios.create({
      baseURL: 'https://cleaner.dadata.ru/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
        'X-Secret': this.secretKey,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    [this.suggestClient, this.cleanClient].forEach((client) => {
      client.interceptors.request.use(
        (config) => {
          this.logger.debug(`📤 Dadata: ${config.method?.toUpperCase()} ${config.url}`);
          return config;
        },
        (error) => Promise.reject(error),
      );

      client.interceptors.response.use(
        (response) => {
          this.logger.debug(`✅ Dadata: ${response.status}`);
          return response;
        },
        (error) => {
          this.logger.error(`❌ Dadata Error: ${error.response?.status || error.message}`);
          return Promise.reject(error);
        },
      );
    });
  }

  // ========== 1. СТАНДАРТИЗАЦИЯ АДРЕСОВ ==========

  /**
   * Стандартизация адреса (API Clean)
   * POST https://cleaner.dadata.ru/api/v1/clean/address
   * 
   * ✔️ Разбивает адрес по полям (регион, город, улица, дом, квартира)
   * ✔️ Рассчитывает корректный индекс
   * ✔️ Определяет координаты
   * ✔️ Достает коды КЛАДР, ФИАС, ОКАТО, ОКТМО, ИФНС
   */
  async cleanAddress(addresses: string[]) {
    if (!this.secretKey) {
      throw new HttpException(
        'DADATA_SECRET_KEY не настроен для работы со стандартизацией',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      this.logger.log(`📍 Стандартизация адресов (${addresses.length} шт.)`);
      const response = await this.cleanClient.post('/clean/address', addresses);
      this.logger.log(`✅ Стандартизовано: ${response.data.length} адресов`);
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка стандартизации адресов');
    }
  }

  /**
   * Стандартизация одного адреса
   */
  async cleanSingleAddress(address: string) {
    const results = await this.cleanAddress([address]);
    return results[0];
  }

  // ========== 2. ПОДСКАЗКИ ПО АДРЕСАМ ==========

  /**
   * Подсказки по адресам (API Suggest)
   * POST https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address
   * 
   * ✔️ Ищет адреса по любой части (от региона до квартиры)
   * ✔️ Работает по всем странам (Россия до квартиры, Беларусь/Казахстан/Узбекистан до дома)
   * ✔️ Находит по историческим названиям (Свердловск → Екатеринбург)
   * ✔️ Исправляет опечатки и неправильную раскладку
   * ✔️ Поиск по кадастровому номеру и ФИАС-коду
   */
  async suggestAddress(query: string, options?: {
    count?: number;
    language?: 'ru' | 'en';
    division?: 'administrative' | 'municipal';
    locations?: Array<{
      kladr_id?: string;
      fias_id?: string;
      region_fias_id?: string;
      area_fias_id?: string;
      city_fias_id?: string;
      settlement_fias_id?: string;
      city?: string;
      region?: string;
      country_iso_code?: string;
    }>;
    locations_geo?: Array<{
      lat: number;
      lon: number;
      radius_meters?: number;
      radius_km?: number;
    }>;
    locations_boost?: Array<{
      kladr_id?: string;
    }>;
    from_bound?: {
      value: 'country' | 'region' | 'area' | 'city' | 'settlement' | 'street' | 'house' | 'flat';
    };
    to_bound?: {
      value: 'country' | 'region' | 'area' | 'city' | 'settlement' | 'street' | 'house' | 'flat';
    };
  }) {
    try {
      this.logger.log(`🔍 Поиск адресов: "${query}"`);
      
      const response = await this.suggestClient.post('/suggest/address', {
        query,
        count: options?.count || 10,
        language: options?.language,
        division: options?.division,
        locations: options?.locations,
        locations_geo: options?.locations_geo,
        locations_boost: options?.locations_boost,
        from_bound: options?.from_bound,
        to_bound: options?.to_bound,
      });

      const count = response.data.suggestions?.length || 0;
      this.logger.log(`✅ Найдено: ${count} подсказок`);
      
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка поиска подсказок по адресам');
    }
  }

  /**
   * Гранулярные подсказки (только определенные части адреса)
   */
  async suggestAddressByType(
    query: string,
    fromBound: 'country' | 'region' | 'area' | 'city' | 'settlement' | 'street' | 'house' | 'flat',
    toBound: 'country' | 'region' | 'area' | 'city' | 'settlement' | 'street' | 'house' | 'flat',
    count = 10,
  ) {
    return this.suggestAddress(query, {
      count,
      from_bound: { value: fromBound },
      to_bound: { value: toBound },
    });
  }

  /**
   * Подсказки только по городам
   */
  async suggestCity(query: string, count = 10) {
    return this.suggestAddressByType(query, 'city', 'city', count);
  }

  /**
   * Подсказки только по улицам
   */
  async suggestStreet(query: string, cityKladr?: string, count = 10) {
    const locations = cityKladr ? [{ kladr_id: cityKladr }] : undefined;
    return this.suggestAddress(query, {
      count,
      from_bound: { value: 'street' },
      to_bound: { value: 'street' },
      locations,
    });
  }

  /**
   * Подсказки по домам
   */
  async suggestHouse(query: string, streetKladr?: string, count = 10) {
    const locations = streetKladr ? [{ kladr_id: streetKladr }] : undefined;
    return this.suggestAddress(query, {
      count,
      from_bound: { value: 'house' },
      to_bound: { value: 'house' },
      locations,
    });
  }

  // ========== 3. ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ==========

  /**
   * Геокодирование - получить координаты по адресу
   */
  async geocodeAddress(query: string) {
    try {
      const response = await this.suggestAddress(query, { count: 1 });
      
      if (response.suggestions && response.suggestions.length > 0) {
        const s = response.suggestions[0];
        return {
          address: s.value,
          unrestricted_value: s.unrestricted_value,
          latitude: s.data.geo_lat ? parseFloat(s.data.geo_lat) : null,
          longitude: s.data.geo_lon ? parseFloat(s.data.geo_lon) : null,
          postal_code: s.data.postal_code,
          kladr_id: s.data.kladr_id,
          fias_id: s.data.fias_id,
          qc_geo: s.data.qc_geo,
          data: s.data,
        };
      }

      return null;
    } catch (error: any) {
      this.logger.error('Ошибка геокодирования:', error.message);
      throw error;
    }
  }

  /**
   * Обратное геокодирование - определить адрес по координатам
   */
  async reverseGeocode(latitude: number, longitude: number, radiusMeters = 100) {
    try {
      const response = await this.suggestClient.post('/geolocate/address', {
        lat: latitude,
        lon: longitude,
        radius_meters: radiusMeters,
        count: 1,
      });

      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка обратного геокодирования');
    }
  }

  /**
   * Определение города по IP
   */
  async detectCityByIp(ip: string) {
    try {
      const response = await this.suggestClient.post('/iplocate/address', { ip });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка определения города по IP');
    }
  }

  /**
   * Поиск адреса по ID (ФИАС, КЛАДР, кадастровый номер)
   */
  async findById(id: string) {
    try {
      const response = await this.suggestClient.post('/findById/address', {
        query: id,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка поиска по ID');
    }
  }

  /**
   * Подсказки по организациям (ИНН, название)
   */
  async suggestOrganization(query: string, count = 10) {
    try {
      const response = await this.suggestClient.post('/suggest/party', {
        query,
        count,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка поиска организации');
    }
  }

  /**
   * Подсказки по ФИО
   */
  async suggestName(query: string, parts?: Array<'NAME' | 'SURNAME' | 'PATRONYMIC'>, count = 10) {
    try {
      const response = await this.suggestClient.post('/suggest/fio', {
        query,
        count,
        parts: parts || ['SURNAME', 'NAME', 'PATRONYMIC'],
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка подсказок по ФИО');
    }
  }

  /**
   * Подсказки по email
   */
  async suggestEmail(query: string, count = 10) {
    try {
      const response = await this.suggestClient.post('/suggest/email', {
        query,
        count,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка подсказок по email');
    }
  }

  /**
   * Подсказки по банкам (БИК, название)
   */
  async suggestBank(query: string, count = 10) {
    try {
      const response = await this.suggestClient.post('/suggest/bank', {
        query,
        count,
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'Ошибка поиска банка');
    }
  }

  // ========== 4. ИНТЕГРАЦИЯ С CDEK ==========

  /**
   * Извлечь данные для CDEK из стандартизованного адреса Dadata
   */
  extractForCdek(cleanedAddress: any) {
    return {
      // Для CDEK API
      city: cleanedAddress.city || cleanedAddress.settlement || '',
      postal_code: cleanedAddress.postal_code || '',
      address: cleanedAddress.result || '',
      country_code: cleanedAddress.country_iso_code || 'RU',
      
      // Координаты
      latitude: cleanedAddress.geo_lat ? parseFloat(cleanedAddress.geo_lat) : null,
      longitude: cleanedAddress.geo_lon ? parseFloat(cleanedAddress.geo_lon) : null,
      
      // Коды для поиска в справочниках CDEK
      region_code: cleanedAddress.region_code ? Number(cleanedAddress.region_code) : null,
      fias_id: cleanedAddress.fias_id || '',
      kladr_id: cleanedAddress.kladr_id || '',
      
      // Детали адреса
      region: cleanedAddress.region || '',
      street: cleanedAddress.street || '',
      house: cleanedAddress.house || '',
      flat: cleanedAddress.flat || '',
      
      // Коды качества
      qc: cleanedAddress.qc,
      qc_complete: cleanedAddress.qc_complete,
      qc_house: cleanedAddress.qc_house,
      qc_geo: cleanedAddress.qc_geo,
    };
  }

  /**
   * Получить полную информацию об адресе для CDEK
   */
  async getAddressForCdek(query: string) {
    try {
      // 1. Получаем подсказки
      const suggestions = await this.suggestAddress(query, { count: 1 });
      
      if (!suggestions.suggestions || suggestions.suggestions.length === 0) {
        return null;
      }

      const suggestion = suggestions.suggestions[0];
      const data = suggestion.data;

      // 2. Форматируем для CDEK
      return {
        // Для отображения
        value: suggestion.value,
        unrestricted_value: suggestion.unrestricted_value,
        
        // Для CDEK location
        postal_code: data.postal_code,
        country_code: data.country_iso_code || 'RU',
        city: data.city || data.settlement,
        address: data.street_with_type
          ? `${data.street_with_type}${data.house ? `, д ${data.house}` : ''}${data.flat ? `, кв ${data.flat}` : ''}`
          : suggestion.value,
        
        // Координаты
        latitude: data.geo_lat ? parseFloat(data.geo_lat) : null,
        longitude: data.geo_lon ? parseFloat(data.geo_lon) : null,
        
        // Коды
        fias_id: data.fias_id,
        kladr_id: data.kladr_id,
        
        // Детали
        region: data.region,
        region_code: data.region_code,
        city_code: null, // CDEK использует свои коды, нужно искать через /location/suggest/cities
        
        // Качество
        qc_geo: data.qc_geo,
        qc_complete: data.qc_complete,
        
        // Полные данные
        full_data: data,
      };
    } catch (error: any) {
      this.logger.error('Ошибка получения адреса для CDEK:', error.message);
      throw error;
    }
  }

  /**
   * Проверка качества адреса для доставки
   */
  checkAddressQuality(cleanedAddress: any): {
    suitable: boolean;
    quality: 'excellent' | 'good' | 'medium' | 'poor';
    issues: string[];
  } {
    const issues: string[] = [];

    // Код проверки (qc)
    if (cleanedAddress.qc === 0) {
      // Отлично
    } else if (cleanedAddress.qc === 1) {
      issues.push('Остались лишние части или недостаточно данных');
    } else if (cleanedAddress.qc === 2) {
      issues.push('Адрес пустой или мусорный');
      return { suitable: false, quality: 'poor', issues };
    } else if (cleanedAddress.qc === 3) {
      issues.push('Есть альтернативные варианты');
    }

    // Пригодность к рассылке (qc_complete)
    const qcComplete = cleanedAddress.qc_complete;
    if (qcComplete === 0) {
      // Отлично
    } else if ([5, 8, 9, 10].includes(qcComplete)) {
      issues.push(this.getQcCompleteMessage(qcComplete));
    } else if ([1, 2, 3, 4, 6, 7].includes(qcComplete)) {
      issues.push(`Не пригоден: ${this.getQcCompleteMessage(qcComplete)}`);
      return { suitable: false, quality: 'poor', issues };
    }

    // Наличие дома в ФИАС (qc_house) и координаты (qc_geo)
    if (cleanedAddress.qc_house === 2 && cleanedAddress.qc_geo === 0) {
      // Идеально
    } else if (cleanedAddress.qc_house === 10) {
      if (cleanedAddress.qc_geo === 0) {
        issues.push('Дом не в ФИАС, но есть на картах');
      } else if (cleanedAddress.qc_geo === 1) {
        issues.push('Дом не в ФИАС, есть похожий на картах');
      } else {
        issues.push('Дом не найден');
        return { suitable: false, quality: 'poor', issues };
      }
    }

    // Определение качества
    let quality: 'excellent' | 'good' | 'medium' | 'poor';
    if (issues.length === 0) {
      quality = 'excellent';
    } else if (issues.length === 1) {
      quality = 'good';
    } else if (issues.length === 2) {
      quality = 'medium';
    } else {
      quality = 'poor';
    }

    return {
      suitable: quality !== 'poor',
      quality,
      issues,
    };
  }

  private getQcCompleteMessage(code: number): string {
    const messages: Record<number, string> = {
      0: 'Пригоден для рассылки',
      1: 'Нет региона',
      2: 'Нет города',
      3: 'Нет улицы',
      4: 'Нет дома',
      5: 'Нет квартиры',
      6: 'Неполный',
      7: 'Иностранный',
      8: 'До почтового отделения',
      9: 'Требуется проверка разбора',
      10: 'Дома нет в ФИАС',
    };
    return messages[code] || `Неизвестный код: ${code}`;
  }

  // ========== ОБРАБОТКА ОШИБОК ==========

  private handleError(error: any, message: string): never {
    const status = error.response?.status;
    const data = error.response?.data;

    let errorMessage = message;
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (status) {
      case 400:
        errorMessage = 'Некорректный запрос к Dadata';
        httpStatus = HttpStatus.BAD_REQUEST;
        break;
      case 401:
        errorMessage = 'API-ключ Dadata отсутствует или неверный';
        httpStatus = HttpStatus.UNAUTHORIZED;
        break;
      case 403:
        errorMessage = 'Не подтверждена почта или недостаточно средств на балансе Dadata';
        httpStatus = HttpStatus.FORBIDDEN;
        break;
      case 405:
        errorMessage = 'Неверный HTTP-метод';
        httpStatus = HttpStatus.METHOD_NOT_ALLOWED;
        break;
      case 413:
        errorMessage = 'Слишком большая длина запроса';
        httpStatus = HttpStatus.PAYLOAD_TOO_LARGE;
        break;
      case 429:
        errorMessage = 'Слишком много запросов к Dadata';
        httpStatus = HttpStatus.TOO_MANY_REQUESTS;
        break;
      default:
        if (status >= 500) {
          errorMessage = 'Внутренняя ошибка сервиса Dadata';
          httpStatus = HttpStatus.BAD_GATEWAY;
        }
    }

    this.logger.error(`${errorMessage}:`, data || error.message);

    throw new HttpException(
      {
        success: false,
        message: errorMessage,
        error: data || error.message,
      },
      httpStatus,
    );
  }
}
