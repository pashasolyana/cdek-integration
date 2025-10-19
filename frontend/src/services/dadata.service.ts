import { apiService } from './api'

export interface DadataSuggestion {
  value: string
  unrestricted_value: string
  data: any
}

export interface DadataResponse {
  suggestions: DadataSuggestion[]
}

export interface AddressData {
  postal_code?: string
  country?: string
  region?: string
  city?: string
  street?: string
  house?: string
  flat?: string
  geo_lat?: string
  geo_lon?: string
  fias_id?: string
  kladr_id?: string
}

export interface NameParts {
  surname?: string
  name?: string
  patronymic?: string
  gender?: string
}

class DadataService {
  private api = apiService.getInstance()

  /**
   * Подсказки по адресам
   */
  async suggestAddress(query: string, count = 10): Promise<DadataResponse> {
    const { data } = await this.api.get('/dadata/suggest/address', {
      params: { query, count }
    })
    return data.data
  }

  /**
   * Подсказки только по городам
   */
  async suggestCity(query: string, count = 10): Promise<DadataResponse> {
    const { data } = await this.api.get('/dadata/suggest/city', {
      params: { query, count }
    })
    return data.data
  }

  /**
   * Геокодирование (адрес → координаты)
   */
  async geocodeAddress(address: string): Promise<AddressData> {
    const { data } = await this.api.get('/dadata/geocode', {
      params: { address }
    })
    return data.data
  }

  /**
   * Обратное геокодирование (координаты → адрес)
   */
  async reverseGeocode(latitude: number, longitude: number, radius = 100): Promise<DadataResponse> {
    const { data } = await this.api.get('/dadata/reverse-geocode', {
      params: { latitude, longitude, radius }
    })
    return data.data
  }

  /**
   * Полная информация об адресе
   */
  async getFullAddressInfo(address: string): Promise<AddressData> {
    const { data } = await this.api.get('/dadata/address-info', {
      params: { address }
    })
    return data.data
  }

  /**
   * Подсказки по ФИО
   */
  async suggestName(query: string, parts?: string[], count = 10): Promise<DadataResponse> {
    const { data } = await this.api.get('/dadata/suggest/name', {
      params: { 
        query, 
        parts: parts?.join(','),
        count 
      }
    })
    return data.data
  }

  /**
   * Поиск организации
   */
  async suggestOrganization(query: string, count = 10): Promise<DadataResponse> {
    const { data } = await this.api.get('/dadata/suggest/organization', {
      params: { query, count }
    })
    return data.data
  }
}

export const dadataService = new DadataService()
