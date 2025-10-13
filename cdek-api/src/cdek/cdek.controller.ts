import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CdekService } from './cdek.service';
import { CdekAuthDto } from './dto/auth.dto';
import { GetOrderQueryDto, OrderInfoResponseDto } from './dto/order.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CalcTariffListRequestDto, CalcTariffListResponseDto } from './dto/calculator.dto';
import { SuggestCitiesQueryDto, RegionsQueryDto, PostalCodesQueryDto, GeolocationQueryDto, CitiesQueryDto } from './dto/location.dto';
import { ListFromDbQueryDto, SyncDeliveryPointsQueryDto } from './dto/cdek.dto';
import { CreateCdekOrderDto } from './dto/create-cdek-order.dto';

@ApiTags('CDEK API')
@Controller('cdek')
export class CdekController {
  private readonly logger = new Logger(CdekController.name);

  constructor(private readonly cdekService: CdekService) {}

  @ApiOperation({
    summary: 'Получить токен авторизации CDEK',
    description: 'Проверяет состояние токена авторизации в CDEK API',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о состоянии токена',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        token_valid: { type: 'boolean' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Сервис CDEK недоступен' })
  @Post('auth/token')
  async getAuthToken() {
    try {
      this.logger.log('Проверка состояния токена CDEK');
      
      // Попытаемся выполнить простой запрос для проверки токена
      // Это автоматически проверит и обновит токен при необходимости
      await this.cdekService.get('/v2/location/cities', { size: 1 });
      
      return {
        success: true,
        message: 'Токен действителен и готов к использованию',
        token_valid: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Ошибка при проверке токена:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось проверить токен авторизации',
          token_valid: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Принудительное обновление токена CDEK',
    description: 'Принудительно запрашивает новый токен от CDEK API и сохраняет его в базу данных',
  })
  @ApiResponse({
    status: 200,
    description: 'Токен успешно обновлен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        token_info: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            token_type: { type: 'string' },
            expires_in: { type: 'number' },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Неверные учетные данные CDEK' })
  @Post('auth/refresh')
  async refreshToken() {
    try {
      this.logger.log('Принудительное обновление токена CDEK');
      
      // Сбрасываем текущий токен для принудительного обновления
      await this.cdekService.forceRefreshToken();
      
      return {
        success: true,
        message: 'Токен успешно обновлен',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Ошибка при принудительном обновлении токена:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось обновить токен',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Получить информацию о заказе по номеру',
    description: 'Получает детальную информацию о ранее созданном заказе по номеру СДЭК или ИМ заказа. В ответе содержатся данные о статусе заказа, деталях доставки и информации о получателе.',
  })
  @ApiQuery({
    name: 'cdek_number',
    required: false,
    description: 'Номер заказа СДЭК, по которому необходима информация',
    type: 'integer',
    example: 1234567890,
  })
  @ApiQuery({
    name: 'im_number',
    required: false,
    description: 'Номер заказа в ИС Клиента, по которому необходима информация',
    type: 'string',
    example: 'ORDER-2024-001',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Информация о заказе получена',
    type: OrderInfoResponseDto
  })
  @ApiResponse({ status: 400, description: 'Неверные параметры запроса' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  @Public()
  @Get('orders')
  async getOrderInfo(@Query() query: GetOrderQueryDto) {
    try {
      this.logger.log(`Запрос информации о заказе: cdek_number=${query.cdek_number}`);
      
      if (!query.cdek_number) {
        throw new HttpException(
          {
            success: false,
            message: 'Необходимо указать параметр cdek_number или im_number',
            error: 'BAD_REQUEST',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const orderInfo = await this.cdekService.getOrderInfo(query.cdek_number);
      
      return {
        success: true,
        data: orderInfo,
        message: 'Информация о заказе получена успешно',
      };
    } catch (error) {
    //  this.logger.error(`Ошибка при получении информации о заказе:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось получить информацию о заказе',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

   @ApiOperation({
    summary: 'Регистрация заказа в CDEK',
    description:
      'Создаёт заказ в CDEK (POST /v2/orders), сохраняет в БД структуру заказа, пакеты/товары, журнал requests и related_entities.',
  })
  @ApiResponse({ status: 201, description: 'Заказ зарегистрирован и сохранён' })
  @ApiResponse({ status: 400, description: 'Неверные данные заказа' })
  @Post('orders')
  async createOrder(@Body() dto: CreateCdekOrderDto) {
    try {
      this.logger.log('Регистрация заказа в CDEK + сохранение в БД');
      const result = await this.cdekService.registerOrder(dto);
      return {
        success: true,
        data: result,
        message: 'Заказ зарегистрирован, данные сохранены',
      };
    } catch (error: any) {
      this.logger.error('Ошибка при регистрации заказа', error?.message, error?.stack);
      throw new HttpException(
        { success: false, message: 'Не удалось зарегистрировать заказ', error: error?.message },
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Получить информацию о заказе по ID',
    description: 'Получает детальную информацию о заказе по его идентификатору (UUID)',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Идентификатор заказа CDEK (UUID)',
    example: '12345678-1234-1234-1234-123456789012',
  })
  @ApiResponse({ status: 200, description: 'Информация о заказе получена' })
  @ApiResponse({ status: 404, description: 'Заказ не найден' })
  @ApiBearerAuth()
  @Get('orders/:orderId')
  async getOrder(@Param('orderId') orderId: string) {
    try {
      this.logger.log(`Запрос информации о заказе по ID: ${orderId}`);
      const order = await this.cdekService.getOrder(orderId);
      return {
        success: true,
        data: order,
        message: 'Информация о заказе получена',
      };
    } catch (error) {
      this.logger.error(`Ошибка при получении заказа ${orderId}:`, error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось получить информацию о заказе',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  

@ApiOperation({
  summary: 'Расчёт по доступным тарифам',
  description: 'Стоимость и сроки по всем доступным тарифам (CDEK /v2/calculator/tarifflist)',
})
@ApiResponse({ status: 200, description: 'OK', type: CalcTariffListResponseDto })
@ApiBearerAuth()
@Post('calculator/tarifflist')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
async calcTariffList(@Body() body: CalcTariffListRequestDto): Promise<{
  success: boolean; data: CalcTariffListResponseDto; message: string;
}> {
  try {
    const data = await this.cdekService.calculateTariffList(body);
    return { success: true, data, message: 'Расчёт выполнен' };
  } catch (error) {
    this.logger.error('Ошибка при расчёте тарифов:', error.message);
    throw new HttpException(
      { success: false, message: 'Не удалось выполнить расчёт тарифов', error: error.message },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

@ApiOperation({ summary: 'Подбор города по названию' })
@ApiBearerAuth()
@Get('location/suggest/cities')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
async suggestCities(@Query() query: SuggestCitiesQueryDto) {
  try {
    this.logger.log(`Подбор города: ${query.name}`);
    const data = await this.cdekService.suggestCities(query);
    return { success: true, data, message: 'Подбор выполнен', count: Array.isArray(data) ? data.length : 0 };
  } catch (error) {
    this.logger.error('Ошибка подбора города:', error.message);
    throw new HttpException({ success: false, message: 'Не удалось выполнить подбор', error: error.message },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@ApiOperation({ summary: 'Список регионов' })
@ApiBearerAuth()
@Get('location/regions')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
async getRegions(@Query() query: RegionsQueryDto) {
  try {
    const data = await this.cdekService.getRegions(query);
    return { success: true, data, message: 'Список регионов получен' };
  } catch (error) {
    this.logger.error('Ошибка получения регионов:', error.message);
    throw new HttpException({ success: false, message: 'Не удалось получить регионы', error: error.message },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@ApiOperation({ summary: 'Почтовые индексы города' })
@ApiBearerAuth()
@Get('location/postalcodes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
async getPostalCodes(@Query() query: PostalCodesQueryDto) {
  try {
    const data = await this.cdekService.getPostalCodesByCity(query.city_code);
    return { success: true, data, message: 'Индексы получены' };
  } catch (error) {
    this.logger.error('Ошибка получения индексов:', error.message);
    throw new HttpException({ success: false, message: 'Не удалось получить индексы', error: error.message },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@ApiOperation({ summary: 'Локация по координатам' })
@ApiBearerAuth()
@Get('location/geolocation')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
async geolocation(@Query() query: GeolocationQueryDto) {
  try {
    const data = await this.cdekService.getLocationByCoordinates(query.latitude, query.longitude);
    return { success: true, data, message: 'Локация определена' };
  } catch (error) {
    this.logger.error('Ошибка геолокации:', error.message);
    throw new HttpException({ success: false, message: 'Не удалось определить локацию', error: error.message },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@ApiOperation({ summary: 'Список населённых пунктов' })
@ApiBearerAuth()
@Get('location/cities')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
async getCities(@Query() query: CitiesQueryDto) {
  try {
    const data = await this.cdekService.getCities(query);
    return { success: true, data, message: 'Список городов получен' };
  } catch (error) {
    this.logger.error('Ошибка получения городов:', error.message);
    throw new HttpException({ success: false, message: 'Не удалось получить города', error: error.message },
      error.status || HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  @ApiOperation({
    summary: 'Статус сервиса CDEK',
    description: 'Проверяет доступность и статус подключения к CDEK API',
  })
  @ApiResponse({
    status: 200,
    description: 'Сервис доступен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        status: { type: 'string' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @Get('status')
  async getStatus() {
    try {
      // Попытаемся выполнить простой запрос для проверки доступности сервиса
      await this.cdekService.get('/v2/location/cities', { size: 1 });
      
      return {
        success: true,
        status: 'healthy',
        message: 'CDEK API доступен и функционирует',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Сервис CDEK недоступен:', error.message);
      return {
        success: false,
        status: 'unhealthy',
        message: 'CDEK API недоступен',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

@ApiOperation({ summary: 'Синхронизация ПВЗ в БД' })
@ApiBearerAuth()
@Get('delivery-points/sync')
async syncDeliveryPoints(@Query() query: SyncDeliveryPointsQueryDto) {
  try {
    const result = await this.cdekService.syncDeliveryPoints(query);
    return { success: true, ...result };
  } catch (e:any) {
    throw new HttpException({ success: false, message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

@ApiOperation({ summary: 'ПВЗ из БД (фильтры, bbox, строковый поиск)' })
@ApiBearerAuth()
@Get('delivery-points/db')
async getFromDb(@Query() q: ListFromDbQueryDto) {
  try {
    // режим радиуса при наличии center_* и radius_km
    if (q.center_lat != null && q.center_lon != null && q.radius_km != null) {
      const usePostGIS = process.env.USE_POSTGIS === 'true';
      const limit = q.limit ?? 100, offset = q.offset ?? 0;
      return usePostGIS
        ? await this.cdekService.listWithinRadiusPostGIS(q.center_lat, q.center_lon, q.radius_km, limit, offset)
        : await this.cdekService.listWithinRadiusHaversine(q.center_lat, q.center_lon, q.radius_km, limit, offset);
    }

    // обычный список/поиск/bbox
    return await this.cdekService.listFromDb({
      type: q.type, city_code: q.city_code, q: q.q,
      lat_min: q.lat_min, lat_max: q.lat_max, lon_min: q.lon_min, lon_max: q.lon_max,
      limit: q.limit, offset: q.offset,
    });
  } catch (e:any) {
    throw new HttpException({ success: false, message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  
}


}