import {
  Controller,
  Get,
  Post,
  Body,
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DadataService } from './dadata.service';
import {
  SuggestAddressQueryDto,
  SuggestCityQueryDto,
  GeocodeQueryDto,
  ReverseGeocodeQueryDto,
  DetectCityByIpQueryDto,
  CleanAddressBodyDto,
  SuggestOrganizationQueryDto,
  SuggestNameQueryDto,
} from './dto/dadata.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Dadata API (Адреса и Геокодирование)')
@SkipThrottle() // Отключаем throttling для всех методов DaData
@Controller('dadata')
export class DadataController {
  private readonly logger = new Logger(DadataController.name);

  constructor(private readonly dadataService: DadataService) {}

  @ApiOperation({
    summary: 'Подсказки по адресам',
    description:
      'Автодополнение адреса при вводе на форме. Возвращает стандартизированные адреса с КЛАДР, ФИАС, координатами.',
  })
  @ApiResponse({ status: 200, description: 'Список подсказок получен' })
  @ApiResponse({ status: 400, description: 'Неверные параметры' })
  @Public()
  @Get('suggest/address')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async suggestAddress(@Query() query: SuggestAddressQueryDto) {
    try {
      this.logger.log(`Подсказки по адресу: ${query.query}`);

      const options: any = {
        count: query.count || 10,
      };

      if (query.from_bound) {
        options.from_bound = { value: query.from_bound };
      }
      if (query.to_bound) {
        options.to_bound = { value: query.to_bound };
      }
      if (query.kladr_id) {
        options.locations = [{ kladr_id: query.kladr_id }];
      }

      const data = await this.dadataService.suggestAddress(
        query.query,
        options,
      );

      return {
        success: true,
        data,
        message: 'Подсказки получены',
        count: data.suggestions?.length || 0,
      };
    } catch (error: any) {
      this.logger.error('Ошибка получения подсказок:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось получить подсказки',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Подсказки только по городам',
    description: 'Поиск города для формы оформления заказа',
  })
  @ApiResponse({ status: 200, description: 'Города найдены' })
  @Public()
  @Get('suggest/city')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async suggestCity(@Query() query: SuggestCityQueryDto) {
    try {
      this.logger.log(`Поиск города: ${query.query}`);
      const data = await this.dadataService.suggestCity(
        query.query,
        query.count,
      );

      return {
        success: true,
        data,
        message: 'Города найдены',
        count: data.suggestions?.length || 0,
      };
    } catch (error: any) {
      this.logger.error('Ошибка поиска города:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось найти город',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Геокодирование адреса',
    description:
      'Определение координат по адресу. Возвращает широту, долготу, почтовый индекс, КЛАДР и ФИАС коды.',
  })
  @ApiResponse({ status: 200, description: 'Координаты определены' })
  @ApiResponse({ status: 404, description: 'Адрес не найден' })
  @Public()
  @Get('geocode')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async geocodeAddress(@Query() query: GeocodeQueryDto) {
    try {
      this.logger.log(`Геокодирование: ${query.address}`);
      const data = await this.dadataService.geocodeAddress(query.address);

      if (!data) {
        throw new HttpException(
          { success: false, message: 'Адрес не найден' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data,
        message: 'Координаты определены',
      };
    } catch (error: any) {
      this.logger.error('Ошибка геокодирования:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось определить координаты',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Обратное геокодирование',
    description: 'Определение адреса по координатам (широте и долготе)',
  })
  @ApiResponse({ status: 200, description: 'Адрес найден' })
  @Public()
  @Get('reverse-geocode')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async reverseGeocode(@Query() query: ReverseGeocodeQueryDto) {
    try {
      this.logger.log(
        `Обратное геокодирование: ${query.latitude}, ${query.longitude}`,
      );
      const data = await this.dadataService.reverseGeocode(
        query.latitude,
        query.longitude,
        query.radius || 100,
      );

      return {
        success: true,
        data,
        message: 'Адрес найден',
      };
    } catch (error: any) {
      this.logger.error('Ошибка обратного геокодирования:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось определить адрес',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Определение города по IP-адресу',
    description:
      'Автоматическое определение города пользователя для предзаполнения формы',
  })
  @ApiResponse({ status: 200, description: 'Город определён' })
  @Public()
  @Get('detect-city')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async detectCityByIp(@Query() query: DetectCityByIpQueryDto) {
    try {
      this.logger.log(`Определение города по IP: ${query.ip}`);
      const data = await this.dadataService.detectCityByIp(query.ip);

      return {
        success: true,
        data,
        message: 'Город определён',
      };
    } catch (error: any) {
      this.logger.error('Ошибка определения города:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось определить город',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Стандартизация адреса',
    description:
      'Очистка и разбор адреса по отдельным полям (регион, город, улица, дом, квартира). Требует DADATA_SECRET_KEY.',
  })
  @ApiResponse({ status: 200, description: 'Адрес стандартизирован' })
  @ApiResponse({
    status: 503,
    description: 'API очистки недоступен (отсутствует SECRET_KEY)',
  })
  @ApiBearerAuth()
  @Post('clean/address')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async cleanAddress(@Body() body: CleanAddressBodyDto) {
    try {
      this.logger.log(`Стандартизация адреса: ${body.address}`);
      const data = await this.dadataService.cleanSingleAddress(body.address);

      return {
        success: true,
        data,
        message: 'Адрес стандартизирован',
      };
    } catch (error: any) {
      this.logger.error('Ошибка стандартизации:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось стандартизировать адрес',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Получение полной информации об адресе',
    description:
      'Полная информация об адресе для заполнения формы CDEK: регион, город, улица, дом, координаты, КЛАДР, ФИАС, почтовый индекс',
  })
  @ApiResponse({ status: 200, description: 'Информация получена' })
  @ApiResponse({ status: 404, description: 'Адрес не найден' })
  @Public()
  @Get('address-info')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getFullAddressInfo(@Query() query: GeocodeQueryDto) {
    try {
      this.logger.log(`Полная информация об адресе: ${query.address}`);
      const data = await this.dadataService.getAddressForCdek(query.address);

      if (!data) {
        throw new HttpException(
          { success: false, message: 'Адрес не найден' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data,
        message: 'Информация получена',
      };
    } catch (error: any) {
      this.logger.error('Ошибка получения информации:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось получить информацию',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Поиск организации по ИНН или названию',
    description:
      'Подсказки по организациям для заполнения данных отправителя/получателя (юрлица)',
  })
  @ApiResponse({ status: 200, description: 'Организации найдены' })
  @Public()
  @Get('suggest/organization')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async suggestOrganization(@Query() query: SuggestOrganizationQueryDto) {
    try {
      this.logger.log(`Поиск организации: ${query.query}`);
      const data = await this.dadataService.suggestOrganization(
        query.query,
        query.count,
      );

      return {
        success: true,
        data,
        message: 'Организации найдены',
        count: data.suggestions?.length || 0,
      };
    } catch (error: any) {
      this.logger.error('Ошибка поиска организации:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось найти организацию',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({
    summary: 'Подсказки по ФИО',
    description: 'Автодополнение ФИО получателя/отправителя при вводе',
  })
  @ApiResponse({ status: 200, description: 'Подсказки получены' })
  @Public()
  @Get('suggest/name')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async suggestName(@Query() query: SuggestNameQueryDto) {
    try {
      this.logger.log(`Подсказки по ФИО: ${query.query}`);
      const data = await this.dadataService.suggestName(
        query.query,
        query.parts,
        query.count,
      );

      return {
        success: true,
        data,
        message: 'Подсказки получены',
        count: data.suggestions?.length || 0,
      };
    } catch (error: any) {
      this.logger.error('Ошибка подсказок ФИО:', error.message);
      throw new HttpException(
        {
          success: false,
          message: 'Не удалось получить подсказки',
          error: error.message,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
