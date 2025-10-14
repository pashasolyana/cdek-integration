// src/cdek/dto/cdek.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export enum OfficeTypeDTO {
  PVZ = 'PVZ',
  POSTAMAT = 'POSTAMAT',
  UNKNOWN = 'UNKNOWN',
}

/** DTO для /cdek/delivery-points/sync (проксируем параметры CDEK) */
export class SyncDeliveryPointsQueryDto {
  @ApiPropertyOptional({ enum: OfficeTypeDTO }) @IsOptional() @IsEnum(OfficeTypeDTO) type?: OfficeTypeDTO;
  @ApiPropertyOptional() @IsOptional() @IsString() country_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() region_code?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() city_code?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() postal_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fias_guid?: string;

  @ApiPropertyOptional() @IsOptional() @IsBooleanString() have_cashless?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() have_cash?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() allowed_cod?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_dressing_room?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() take_only?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_handout?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_reception?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_marketplace?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_ltl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() fulfillment?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() weight_max?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() weight_min?: number;

  @ApiPropertyOptional({ description: 'Размер страницы при чтении из API CDEK' })
  @IsOptional() @IsInt() @Min(1) @Max(1000) size?: number;
}

/** DTO для /cdek/delivery-points/db (фильтры, поиск, гео) */
export class ListFromDbQueryDto {
  @ApiPropertyOptional({ enum: OfficeTypeDTO }) @IsOptional() @IsEnum(OfficeTypeDTO) type?: OfficeTypeDTO;
  @ApiPropertyOptional() @IsOptional() @IsInt() city_code?: number;
  @ApiPropertyOptional({ description: 'Поиск по адресу/коду/городу' })
  @IsOptional() @IsString() q?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() country_code?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() region_code?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() postal_code?: string;
  @ApiPropertyOptional({ description: 'Фильтр по коду ПВЗ (substring match)' })
  @IsOptional() @IsString() code?: string;

  @ApiPropertyOptional() @IsOptional() @IsBooleanString() take_only?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_handout?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_reception?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_dressing_room?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_marketplace?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() is_ltl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() have_cashless?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() have_cash?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() have_fast_payment_system?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() allowed_cod?: string;
  @ApiPropertyOptional() @IsOptional() @IsBooleanString() fulfillment?: string;

  @ApiPropertyOptional({ description: 'weight_min ≤ N' })
  @IsOptional() @IsNumber() weight_min_lte?: number;
  @ApiPropertyOptional({ description: 'weight_max ≥ N' })
  @IsOptional() @IsNumber() weight_max_gte?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() lat_min?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lat_max?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lon_min?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lon_max?: number;

  @ApiPropertyOptional({ description: 'Центр: широта' }) @IsOptional() @IsNumber() center_lat?: number;
  @ApiPropertyOptional({ description: 'Центр: долгота' }) @IsOptional() @IsNumber() center_lon?: number;
  @ApiPropertyOptional({ description: 'Радиус в км' }) @IsOptional() @IsNumber() @Min(0.1) @Max(200) radius_km?: number;

  @ApiPropertyOptional({ enum: ['city_code','type','code','distance'] as const })
  @IsOptional() @IsString() sort_by?: 'city_code'|'type'|'code'|'distance';
  @ApiPropertyOptional({ enum: ['asc','desc'] as const })
  @IsOptional() @IsString() sort_order?: 'asc'|'desc';

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) offset?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(1000) limit?: number;
}
