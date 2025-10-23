import { apiService } from './api'

export interface CdekCity {
  city_uuid: string
  code: number
  full_name: string
  country_code: string
  city?: string
  region?: string
  country?: string
  latitude?: number
  longitude?: number
  postal_codes?: string[]
}

export interface CdekDeliveryPoint {
  code: string
  name: string
  location: {
    address: string
    city: string
    country_code: string
    latitude: number
    longitude: number
  }
  work_time?: string
  phones?: Array<{ number: string }>
  type: 'PVZ' | 'POSTAMAT'
}

export interface TariffCalculation {
  tariff_code: number
  tariff_name: string
  tariff_description: string
  delivery_mode: string
  delivery_sum: number
  period_min: number
  period_max: number
  total_sum: number
}

export interface PackageItem {
  weight: number
  length: number
  width: number
  height: number
  type?: string
}

export interface CalculateTariffRequest {
  date: string // Дата планируемой передачи заказа в формате ISO
  type?: number // 1 - ИМ, 2 - Склад-склад
  from_location: {
    code?: number
    postal_code?: string
    country_code?: string
    city?: string
    address?: string
  }
  to_location: {
    code?: number
    postal_code?: string
    country_code?: string
    city?: string
    address?: string
  }
  packages: PackageItem[]
  currency?: number
  lang?: string
}

class CdekService {
  private api = apiService.getInstance()

  /**
   * Подбор города по названию
   */
  async suggestCities(name: string, country_codes = 'RU', size = 10): Promise<CdekCity[]> {
    const { data } = await this.api.get('/cdek/location/suggest/cities', {
      params: { name, country_codes, size }
    })
    return data.data
  }

  /**
   * Список городов с фильтрами
   */
  async getCities(params: {
    country_code?: string
    region_code?: number
    postal_code?: string
    code?: number
    size?: number
    page?: number
  }): Promise<CdekCity[]> {
    const { data } = await this.api.get('/cdek/location/cities', { params })
    return data.data
  }

  /**
   * Поиск ПВЗ из БД
   */
  async getDeliveryPoints(params: {
    type?: 'PVZ' | 'POSTAMAT'
    city_code?: number
    q?: string
    lat_min?: number
    lat_max?: number
    lon_min?: number
    lon_max?: number
    limit?: number
    offset?: number
  }): Promise<CdekDeliveryPoint[]> {
    const { data } = await this.api.get('/cdek/delivery-points/db', { params })
    return data.data || data
  }

  /**
   * Поиск ПВЗ из БД (полный ответ с total и rows)
   */
  async getDeliveryPointsFromDb(params: {
    type?: 'PVZ' | 'POSTAMAT'
    city_code?: number
    q?: string
    lat_min?: number
    lat_max?: number
    lon_min?: number
    lon_max?: number
    limit?: number
    offset?: number
  }): Promise<{ total: number; rows: any[] }> {
    const { data } = await this.api.get('/cdek/delivery-points/db', { params })
    return data
  }

  /**
   * Поиск ПВЗ по радиусу
   */
  async getDeliveryPointsInRadius(
    center_lat: number,
    center_lon: number,
    radius_km: number,
    limit = 20
  ): Promise<CdekDeliveryPoint[]> {
    const { data } = await this.api.get('/cdek/delivery-points/db', {
      params: { center_lat, center_lon, radius_km, limit }
    })
    return data.data || data
  }

  /**
   * Расчёт стоимости и сроков доставки
   */
  async calculateTariff(request: CalculateTariffRequest): Promise<TariffCalculation[]> {
    const { data } = await this.api.post('/cdek/calculator/tarifflist', request)
    return data.data?.tariff_codes || []
  }

  /**
   * Регистрация заказа
   */
  async createOrder(orderData: any): Promise<any> {
    const { data } = await this.api.post('/cdek/orders', orderData)
    return data.data
  }

  /**
   * Получение информации о заказе
   */
  async getOrderInfo(cdek_number?: number, im_number?: string): Promise<any> {
    const { data } = await this.api.get('/cdek/orders', {
      params: { cdek_number, im_number }
    })
    return data.data
  }

  /**
   * Получение списка заказов с фильтрацией
   */
  async getOrdersList(params: {
    limit?: number
    offset?: number
    dateFrom?: string
    dateTo?: string
    tariffCode?: number
  } = {}): Promise<{ total: number; orders: any[] }> {
    const { data } = await this.api.get('/cdek/orders/list', { params })
    return {
      total: data.total,
      orders: data.orders
    }
  }

  /**
   * Печать накладной к заказу
   * @param orders - Список заказов для печати (максимум 100)
   * @param type - Форма квитанции (по умолчанию tpl_russia)
   * @returns Объект с URL и PDF в Base64 для скачивания накладной
   */
  async printWaybill(
    orders: Array<{ order_uuid?: string; cdek_number?: number; copy_count?: number }>,
    type: string = 'tpl_russia'
  ): Promise<{ url: string; pdfBase64?: string; entity: any; status: string }> {
    const { data } = await this.api.post('/cdek/orders/print-waybill', {
      orders,
      type
    })
    return {
      url: data.url,
      pdfBase64: data.pdfBase64,
      entity: data.entity,
      status: data.status
    }
  }

  /**
   * Формирование ШК места к заказу
   * @param orders - Список заказов для печати ШК (максимум 100)
   * @param format - Формат печати (по умолчанию A4)
   * @param lang - Язык печатной формы (по умолчанию RUS)
   * @param copy_count - Количество копий (по умолчанию 1)
   * @returns Объект с URL и PDF в Base64 для скачивания ШК места
   */
  async printBarcode(
    orders: Array<{ order_uuid?: string; cdek_number?: number }>,
    format: string = 'A4',
    lang: string = 'RUS',
    copy_count: number = 1
  ): Promise<{ url: string; pdfBase64?: string; entity: any; status: string }> {
    const { data } = await this.api.post('/cdek/orders/print-barcode', {
      orders,
      format,
      lang,
      copy_count
    })
    return {
      url: data.url,
      pdfBase64: data.pdfBase64,
      entity: data.entity,
      status: data.status
    }
  }
}

export const cdekService = new CdekService()
