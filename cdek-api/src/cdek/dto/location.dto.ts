import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class SuggestCitiesQueryDto {
  @ApiProperty({ description: 'Название населенного пункта', example: 'Санкт' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'ISO_3166-1_alpha-2', example: 'RU' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country_codes?: string;

  @ApiPropertyOptional({
    description: 'Количество результатов',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;
}

export class RegionsQueryDto {
  @ApiPropertyOptional({
    description: 'Список ISO2-кодов стран через запятую',
    example: 'RU,KZ',
  })
  @IsOptional()
  @IsString()
  country_codes?: string;

  /** deprecated, но CDEK ещё принимает */
  @ApiPropertyOptional({ description: 'FIAS региона (устаревшее)' })
  @IsOptional()
  @IsUUID()
  fias_region_guid?: string;

  @ApiPropertyOptional({ description: 'Размер страницы', default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;

  @ApiPropertyOptional({ description: 'Номер страницы', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ description: 'Локализация ответа', example: 'rus' })
  @IsOptional()
  @IsString()
  lang?: string;
}

export class PostalCodesQueryDto {
  @ApiProperty({ description: 'Код города из справочника CDEK', example: 44 })
  @IsInt()
  @Min(1)
  city_code!: number;
}

export class GeolocationQueryDto {
  @ApiProperty({ description: 'Широта', example: 59.9386 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ description: 'Долгота', example: 30.3141 })
  @IsNumber()
  longitude!: number;
}

export class CitiesQueryDto {
  @ApiPropertyOptional({
    description: 'ISO2 коды стран через запятую',
    example: 'RU,KZ',
  })
  @IsOptional()
  @IsString()
  country_codes?: string;

  @ApiPropertyOptional({ description: 'Код региона CDEK', example: 78 })
  @IsOptional()
  @IsInt()
  @Min(1)
  region_code?: number;

  @ApiPropertyOptional({ description: 'КЛАДР региона' })
  @IsOptional()
  @IsString()
  kladr_region_code?: string;

  /** deprecated, но CDEK ещё принимает */
  @ApiPropertyOptional({ description: 'FIAS региона (устаревшее)' })
  @IsOptional()
  @IsUUID()
  fias_region_guid?: string;

  @ApiPropertyOptional({ description: 'КЛАДР города' })
  @IsOptional()
  @IsString()
  kladr_code?: string;

  @ApiPropertyOptional({ description: 'FIAS города' })
  @IsOptional()
  @IsUUID()
  fias_guid?: string;

  @ApiPropertyOptional({ description: 'Почтовый индекс' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Код города CDEK' })
  @IsOptional()
  @IsInt()
  @Min(1)
  code?: number;

  @ApiPropertyOptional({ description: 'Название города (полное соответствие)' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Лимит НП оплаты (-1 нет ограничений, 0 — не принимается)',
    example: -1,
  })
  @IsOptional()
  @IsNumber()
  payment_limit?: number;

  @ApiPropertyOptional({ description: 'Размер страницы', default: 1000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  size?: number;

  @ApiPropertyOptional({ description: 'Номер страницы', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ description: 'Локализация', example: 'rus' })
  @IsOptional()
  @IsString()
  lang?: string;
}
