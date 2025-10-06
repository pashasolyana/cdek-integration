import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculatorLocationDto {
  @ApiPropertyOptional({ description: 'Код города из справочника CDEK' })
  @IsOptional() @IsInt() code?: number;

  @ApiPropertyOptional({ description: 'Почтовый индекс' })
  @IsOptional() @IsString() postal_code?: string;

  @ApiPropertyOptional({ description: 'Код страны (ISO-2)', example: 'RU' })
  @IsOptional() @IsString() @Length(2, 2) country_code?: string;

  @ApiPropertyOptional({ description: 'Город', example: 'Москва' })
  @IsOptional() @IsString() city?: string;

  @ApiPropertyOptional({ description: 'Адрес (используйте для door-to-door)' })
  @IsOptional() @IsString() address?: string;

  @ApiPropertyOptional({ description: 'Тип контрагента', enum: ['INDIVIDUAL','LEGAL_ENTITY'] })
  @IsOptional() @IsString() contragent_type?: string;

  @ApiPropertyOptional({ description: 'Долгота' }) @IsOptional() @IsNumber() longitude?: number;
  @ApiPropertyOptional({ description: 'Широта'  }) @IsOptional() @IsNumber() latitude?: number;
}

export class CalcPackageRequestDto {
  @ApiProperty({ description: 'Вес, граммы', example: 1500 })
  @IsInt() @Min(1) weight!: number;

  @ApiProperty({ description: 'Длина, см', example: 20 })
  @IsInt() @Min(1) length!: number;

  @ApiProperty({ description: 'Ширина, см', example: 15 })
  @IsInt() @Min(1) width!: number;

  @ApiProperty({ description: 'Высота, см', example: 10 })
  @IsInt() @Min(1) height!: number;
}

export class CalcTariffListRequestDto {
  @ApiProperty({
    description: "Дата/время планируемой передачи заказа",
    example: "2025-03-24T14:15:22+0700"
  })
  @IsString()
  date!: string;

  @ApiPropertyOptional({ description: 'Тип заказа: 1 — ИМ, 2 — Доставка', default: 1 })
  @IsOptional() @IsInt() @Min(1) @Max(2) type?: number = 1;

  @ApiPropertyOptional({ description: 'Доп.типы заказа (см. документацию)', type: [Number] })
  @IsOptional() @IsArray() @IsInt({ each: true }) additional_order_types?: number[];

  @ApiPropertyOptional({ description: 'Валюта (числовой код ISO 4217)' })
  @IsOptional() @IsInt() currency?: number;

  @ApiPropertyOptional({ description: 'Язык (rus|eng|zho)', default: 'rus' })
  @IsOptional() @IsString() @IsIn(['rus','eng','zho']) lang?: string = 'rus';

  @ApiProperty({ type: () => CalculatorLocationDto, description: 'Откуда' })
  @ValidateNested() @Type(() => CalculatorLocationDto)
  from_location!: CalculatorLocationDto;

  @ApiProperty({ type: () => CalculatorLocationDto, description: 'Куда' })
  @ValidateNested() @Type(() => CalculatorLocationDto)
  to_location!: CalculatorLocationDto;

  @ApiProperty({ type: () => [CalcPackageRequestDto], description: 'Упаковки' })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CalcPackageRequestDto)
  packages!: CalcPackageRequestDto[];
}

export class CalcTariffItemDto {
  @ApiProperty() tariff_code!: number;
  @ApiProperty() tariff_name!: string;
  @ApiProperty() tariff_description!: string;
  @ApiProperty() delivery_mode!: number;
  @ApiProperty() delivery_sum!: number;
  @ApiProperty() period_min!: number;
  @ApiProperty() period_max!: number;
  @ApiProperty() calendar_min!: number;
  @ApiProperty() calendar_max!: number;
  @ApiProperty({ type: () => Object, example: { min: '2022-02-02', max: '2022-02-04' }})
  delivery_date_range!: { min: string; max: string };
}

export class CalcTariffListResponseDto {
  @ApiProperty({ type: () => [CalcTariffItemDto] })
  tariff_codes!: CalcTariffItemDto[];

  @ApiProperty({ type: () => [Object] })
  errors?: Array<{ code: string; additional_code?: string; message: string }>;

  @ApiProperty({ type: () => [Object] })
  warnings?: Array<{ code: string; message: string }>;
}
