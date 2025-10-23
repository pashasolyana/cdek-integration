import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SuggestAddressQueryDto {
  @ApiProperty({
    description: 'Строка для поиска адреса',
    example: 'Москва, Тверская',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Количество подсказок',
    default: 10,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;

  @ApiPropertyOptional({
    description: 'Начальный уровень детализации',
    enum: ['country', 'region', 'city', 'settlement', 'street', 'house'],
  })
  @IsOptional()
  @IsString()
  from_bound?:
    | 'country'
    | 'region'
    | 'city'
    | 'settlement'
    | 'street'
    | 'house';

  @ApiPropertyOptional({
    description: 'Конечный уровень детализации',
    enum: ['country', 'region', 'city', 'settlement', 'street', 'house'],
  })
  @IsOptional()
  @IsString()
  to_bound?: 'country' | 'region' | 'city' | 'settlement' | 'street' | 'house';

  @ApiPropertyOptional({
    description: 'КЛАДР-код для фильтрации (город, регион)',
  })
  @IsOptional()
  @IsString()
  kladr_id?: string;
}

export class SuggestCityQueryDto {
  @ApiProperty({ description: 'Название города', example: 'Москва' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Количество подсказок', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}

export class GeocodeQueryDto {
  @ApiProperty({
    description: 'Адрес для геокодирования',
    example: 'Москва, Красная площадь, 1',
  })
  @IsString()
  address!: string;
}

export class ReverseGeocodeQueryDto {
  @ApiProperty({ description: 'Широта', example: 55.7558 })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Долгота', example: 37.6173 })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Радиус поиска в метрах',
    default: 100,
    minimum: 10,
    maximum: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(5000)
  radius?: number;
}

export class DetectCityByIpQueryDto {
  @ApiProperty({ description: 'IP-адрес', example: '46.226.227.38' })
  @IsString()
  ip!: string;
}

export class CleanAddressBodyDto {
  @ApiProperty({
    description: 'Адрес для стандартизации',
    example: 'мск сухонская 11 89',
  })
  @IsString()
  address!: string;
}

export class SuggestOrganizationQueryDto {
  @ApiProperty({
    description: 'ИНН, название или ОГРН организации',
    example: 'Сбербанк',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({ description: 'Количество подсказок', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}

export class SuggestNameQueryDto {
  @ApiProperty({ description: 'ФИО или часть ФИО', example: 'Иван' })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Части ФИО для поиска',
    enum: ['NAME', 'SURNAME', 'PATRONYMIC'],
    isArray: true,
  })
  @IsOptional()
  parts?: Array<'NAME' | 'SURNAME' | 'PATRONYMIC'>;

  @ApiPropertyOptional({ description: 'Количество подсказок', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  count?: number;
}
