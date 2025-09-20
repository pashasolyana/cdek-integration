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
      console.log('1234')
      const orderInfo = await this.cdekService.getOrderInfo(query.cdek_number);
      
      return {
        success: true,
        data: orderInfo,
        message: 'Информация о заказе получена успешно',
      };
    } catch (error) {
      this.logger.error(`Ошибка при получении информации о заказе:`, error);
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
    summary: 'Создать новый заказ',
    description: 'Создает новый заказ на доставку в системе CDEK',
  })
  @ApiResponse({ status: 201, description: 'Заказ создан успешно' })
  @ApiResponse({ status: 400, description: 'Неверные данные заказа' })
  @ApiBearerAuth()
  @Post('orders')
  async createOrder(@Body() orderData: any) {
    try {
      this.logger.log('Создание нового заказа CDEK');
      const order = await this.cdekService.createOrder(orderData);
      return {
        success: true,
        data: order,
        message: 'Заказ создан успешно',
      };
    } catch (error) {
      this.logger.error('Ошибка при создании заказа:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось создать заказ',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
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
    summary: 'Получить список пунктов выдачи',
    description: 'Получает список доступных пунктов выдачи с возможностью фильтрации',
  })
  @ApiQuery({
    name: 'city_code',
    required: false,
    description: 'Код города для фильтрации',
    example: 44,
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Тип пункта выдачи (PVZ, POSTAMAT)',
    example: 'PVZ',
  })
  @ApiResponse({ status: 200, description: 'Список пунктов выдачи получен' })
  @ApiBearerAuth()
  @Get('delivery-points')
  async getDeliveryPoints(
    @Query('city_code') cityCode?: string,
    @Query('type') type?: string,
    @Query() otherParams?: any,
  ) {
    try {
      this.logger.log('Запрос списка пунктов выдачи');
      const params = {
        ...(cityCode && { city_code: cityCode }),
        ...(type && { type }),
        ...otherParams,
      };

      const points = await this.cdekService.getDeliveryPoints(params);
      return {
        success: true,
        data: points,
        message: 'Список пунктов выдачи получен',
        count: Array.isArray(points) ? points.length : 0,
      };
    } catch (error) {
      this.logger.error('Ошибка при получении пунктов выдачи:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось получить пункты выдачи',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Рассчитать стоимость доставки',
    description: 'Рассчитывает стоимость и сроки доставки для заданных параметров',
  })
  @ApiResponse({ status: 200, description: 'Расчет выполнен успешно' })
  @ApiResponse({ status: 400, description: 'Неверные параметры для расчета' })
  @ApiBearerAuth()
  @Post('calculate')
  async calculateDelivery(@Body() calculationData: any) {
    try {
      this.logger.log('Расчет стоимости доставки');
      const calculation = await this.cdekService.calculateDelivery(calculationData);
      return {
        success: true,
        data: calculation,
        message: 'Расчет выполнен успешно',
      };
    } catch (error) {
      this.logger.error('Ошибка при расчете доставки:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось выполнить расчет доставки',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
}