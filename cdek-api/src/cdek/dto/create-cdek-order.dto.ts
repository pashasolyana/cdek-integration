import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';


export class PhoneDto {
  @ApiProperty({ example: '+79990000000' })
  @IsString()
  @MaxLength(32)
  number: string;

  @ApiPropertyOptional({ example: '123' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  additional?: string;
}

export enum ContragentType {
  INDIVIDUAL = 'INDIVIDUAL',
  LEGAL_ENTITY = 'LEGAL_ENTITY',
}

export class ContactDto {
  @ApiPropertyOptional({ example: 'ООО Ромашка' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  company?: string;

  @ApiPropertyOptional({ example: 'Иванов Иван' })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  name?: string;

  @ApiPropertyOptional({ enum: ContragentType })
  @IsOptional()
  @IsEnum(ContragentType)
  contragent_type?: ContragentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passport_series?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passport_number?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  passport_date_of_issue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passport_organization?: string;

  @ApiPropertyOptional({ description: 'ИНН' })
  @IsOptional()
  @IsString()
  tin?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  passport_date_of_birth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ type: [PhoneDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhoneDto)
  phones?: PhoneDto[];
}

export class SellerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'ИНН' })
  @IsOptional()
  @IsString()
  inn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Форма собственности' })
  @IsOptional()
  @IsString()
  ownership_form?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  // спец. поля под маркировки/ГИИС и т.п. — оставляем как есть
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  giis_subdivision_id?: string;
}

export class LocationDto {
  @ApiPropertyOptional({ description: 'Код ПВЗ/офиса CDEK' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  code?: number;

  @ApiPropertyOptional({ description: 'UUID города в СДЭК' })
  @IsOptional()
  @IsString()
  city_uuid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'ФИАС-гуид города' })
  @IsOptional()
  @IsString()
  fias_guid?: string;

  @ApiPropertyOptional({ description: 'КЛАДР-код' })
  @IsOptional()
  @IsString()
  kladr_code?: string;

  @ApiPropertyOptional({ example: 'RU' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  region_code?: number;

  @ApiPropertyOptional({ description: 'ФИАС-гуид региона' })
  @IsOptional()
  @IsString()
  fias_region_guid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sub_region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  time_zone?: string;

  @ApiPropertyOptional({ description: 'Лимит наложенного платежа' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  payment_limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  latitude?: number;
}

export class AdditionalServiceDto {
  @ApiProperty({ example: 'INSURANCE' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: '10000' })
  @IsOptional()
  @IsString()
  parameter?: string;
}

export class PaymentDto {
  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  value?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vat_sum?: number;

  @ApiPropertyOptional({ example: 0, description: 'ставка НДС, напр. 0/10/20' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vat_rate?: number;
}

export class ItemSellerDto extends SellerDto {}

export class PackageItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ware_key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marking?: string;

  @ApiPropertyOptional({ type: PaymentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDto)
  payment?: PaymentDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight_gross?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name_i18n?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'RU' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  country_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  material?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  wifi_gsm?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ type: ItemSellerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemSellerDto)
  seller?: ItemSellerDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  feacn_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jewel_uin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  used?: boolean;
}

export class PackageRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  length?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
   @Transform(({ value }) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
})
  comment?: string;

  @ApiPropertyOptional({ type: [PackageItemDto] })
  @IsOptional()
@IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageItemDto)
  items?: PackageItemDto[];

  @ApiPropertyOptional({ description: 'Внешний идентификатор упаковки' })
  @IsOptional()
  @IsString()
  package_id?: string;
}

// ======== Root DTO

export class CreateCdekOrderDto {
  @ApiProperty({ enum: [1, 2], description: '1 — интернет-магазин, 2 — доставка' })
  @Type(() => Number)
  @IsInt()
  type: number;

  @ApiPropertyOptional({ type: [Number], description: 'Доп.типы заказа (например, 2,4,6,7,9,10,11,14,15)' })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  additional_order_types?: number[];

  @ApiPropertyOptional({ description: 'Номер заказа в ИС клиента (для ИМ)' })
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional({ description: 'Номер сопроводительной накладной (СНТ)' })
  @IsOptional()
  @IsString()
  accompanying_number?: string;

  @ApiProperty({ description: 'Код тарифа CDEK' })
  @Type(() => Number)
  @IsInt()
  tariff_code: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
     @Transform(({ value }) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string' && value.trim() === '') return undefined;
  return value;
})
  comment?: string;

  @ApiPropertyOptional({ description: 'Код ПВЗ при «от склада»' })
  @IsOptional()
  @IsString()
  shipment_point?: string;

  @ApiPropertyOptional({ description: 'Код ПВЗ при «до склада/постамата»' })
  @IsOptional()
  @IsString()
  delivery_point?: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Делает заказ международным при заполнении' })
  @IsOptional()
  @IsDateString()
  date_invoice?: string;

  @ApiPropertyOptional({ description: 'Имя грузоотправителя (международные ИМ)' })
  @IsOptional()
  @IsString()
  shipper_name?: string;

  @ApiPropertyOptional({ description: 'Адрес грузоотправителя (международные ИМ)' })
  @IsOptional()
  @IsString()
  shipper_address?: string;

  @ApiPropertyOptional({ description: 'ДСД: сумма, НДС и ставка. (Только для ИМ)' })
  @IsOptional()
  delivery_recipient_cost?: PaymentDto;

  @ApiPropertyOptional({ description: 'Пороговые ДСД (Только для ИМ)', type: [PaymentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  delivery_recipient_cost_adv?: PaymentDto[];

  @ApiPropertyOptional({ type: ContactDto, description: 'Отправитель (обязателен при type=2 «доставка»)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  sender?: ContactDto;

  @ApiPropertyOptional({ type: SellerDto, description: 'Истинный продавец' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SellerDto)
  seller?: SellerDto;

  @ApiProperty({ type: ContactDto, description: 'Получатель' })
  @ValidateNested()
  @Type(() => ContactDto)
  recipient: ContactDto;

  @ApiPropertyOptional({ type: LocationDto, description: 'Адрес отправления. Конфликтует с shipment_point' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  from_location?: LocationDto;

  @ApiPropertyOptional({ type: LocationDto, description: 'Адрес получения. Конфликтует с delivery_point' })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  to_location?: LocationDto;

  @ApiPropertyOptional({ type: [AdditionalServiceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalServiceDto)
  services?: AdditionalServiceDto[];

  @ApiProperty({ type: [PackageRequestDto], description: 'Список упаковок (1..255)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PackageRequestDto)
  packages: PackageRequestDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  is_client_return?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  has_reverse_order?: boolean;

  @ApiPropertyOptional({ description: 'Ключ разработчика' })
  @IsOptional()
  @IsString()
  developer_key?: string;

  @ApiPropertyOptional({ enum: ['WAYBILL', 'BARCODE'] })
  @IsOptional()
  @IsIn(['WAYBILL', 'BARCODE'])
  print?: 'WAYBILL' | 'BARCODE';

  @ApiPropertyOptional({ description: 'Токен CMS (widget_token)' })
  @IsOptional()
  @IsString()
  widget_token?: string;
}