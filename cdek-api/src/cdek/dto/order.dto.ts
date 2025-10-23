import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetOrderQueryDto {
  @ApiPropertyOptional({
    description: 'Номер заказа СДЭК, по которому необходима информация',
    example: 1234567890,
    type: 'integer',
    format: 'int64',
  })
  @IsOptional()
  @IsNumber()
  cdek_number?: number;

  @ApiPropertyOptional({
    description: 'Номер заказа в ИС Клиента, по которому необходима информация',
    example: 'ORDER-2024-001',
  })
  @IsOptional()
  @IsString()
  im_number?: string;
}

export class PhoneDto {
  @ApiProperty({ description: 'Номер телефона' })
  number: string;

  @ApiPropertyOptional({ description: 'Дополнительная информация' })
  additional?: string;
}

export class ContactDto {
  @ApiPropertyOptional({ description: 'Название компании' })
  company?: string;

  @ApiProperty({ description: 'ФИО контакта' })
  name: string;

  @ApiPropertyOptional({
    description: 'Тип контрагента',
    enum: ['LEGAL_ENTITY', 'INDIVIDUAL'],
  })
  contragent_type?: string;

  @ApiPropertyOptional({ description: 'Серия паспорта' })
  passport_series?: string;

  @ApiPropertyOptional({ description: 'Номер паспорта' })
  passport_number?: string;

  @ApiPropertyOptional({ description: 'Дата выдачи паспорта' })
  @IsDateString()
  passport_date_of_issue?: string;

  @ApiPropertyOptional({ description: 'Орган выдавший паспорт' })
  passport_organization?: string;

  @ApiPropertyOptional({ description: 'ИНН' })
  tin?: string;

  @ApiPropertyOptional({ description: 'Дата рождения' })
  @IsDateString()
  passport_date_of_birth?: string;

  @ApiPropertyOptional({ description: 'Email' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Телефоны',
    type: [PhoneDto],
  })
  @ValidateNested({ each: true })
  @Type(() => PhoneDto)
  phones?: PhoneDto[];

  @ApiPropertyOptional({ description: 'Выполнены ли требования по паспорту' })
  @IsBoolean()
  passport_requirements_satisfied?: boolean;
}

export class LocationDto {
  @ApiPropertyOptional({ description: 'Код населенного пункта СДЭК' })
  code?: number;

  @ApiPropertyOptional({ description: 'Уникальный идентификатор города' })
  city_uuid?: string;

  @ApiPropertyOptional({ description: 'Название города' })
  city?: string;

  @ApiPropertyOptional({ description: 'Код ФИАС' })
  fias_guid?: string;

  @ApiPropertyOptional({ description: 'Код КЛАДР' })
  kladr_code?: string;

  @ApiPropertyOptional({ description: 'Код страны' })
  country_code?: string;

  @ApiPropertyOptional({ description: 'Название страны' })
  country?: string;

  @ApiPropertyOptional({ description: 'Название региона' })
  region?: string;

  @ApiPropertyOptional({ description: 'Код региона' })
  region_code?: number;

  @ApiPropertyOptional({ description: 'Код ФИАС региона' })
  fias_region_guid?: string;

  @ApiPropertyOptional({ description: 'Название района региона' })
  sub_region?: string;

  @ApiPropertyOptional({ description: 'Долгота' })
  longitude?: number;

  @ApiPropertyOptional({ description: 'Широта' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Часовой пояс' })
  time_zone?: string;

  @ApiPropertyOptional({ description: 'Ограничение оплаты наличными' })
  payment_limit?: number;

  @ApiPropertyOptional({ description: 'Полный адрес' })
  address?: string;

  @ApiPropertyOptional({ description: 'Почтовый индекс' })
  postal_code?: string;
}

export class PaymentDto {
  @ApiProperty({ description: 'Сумма' })
  value: number;

  @ApiPropertyOptional({ description: 'Сумма НДС' })
  vat_sum?: number;

  @ApiPropertyOptional({ description: 'Ставка НДС' })
  vat_rate?: number;
}

export class ServiceDto {
  @ApiProperty({ description: 'Код дополнительной услуги' })
  code: string;

  @ApiPropertyOptional({ description: 'Параметр дополнительной услуги' })
  parameter?: string;

  @ApiPropertyOptional({ description: 'Стоимость услуги' })
  sum?: number;

  @ApiPropertyOptional({ description: 'Итоговая стоимость услуги' })
  total_sum?: number;

  @ApiPropertyOptional({ description: 'Размер скидки в процентах' })
  discount_percent?: number;

  @ApiPropertyOptional({ description: 'Размер скидки в валюте' })
  discount_sum?: number;

  @ApiPropertyOptional({ description: 'Ставка НДС' })
  vat_rate?: number;

  @ApiPropertyOptional({ description: 'Сумма НДС' })
  vat_sum?: number;
}

export class SellerDto {
  @ApiPropertyOptional({ description: 'Наименование истинного продавца' })
  name?: string;

  @ApiPropertyOptional({ description: 'ИНН истинного продавца' })
  inn?: string;

  @ApiPropertyOptional({ description: 'Телефон истинного продавца' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Форма собственности' })
  ownership_form?: string;

  @ApiPropertyOptional({ description: 'Адрес истинного продавца' })
  address?: string;

  @ApiPropertyOptional({ description: 'Идентификатор подразделения ГИИС' })
  giis_subdivision_id?: string;
}

export class ItemDto {
  @ApiProperty({ description: 'Наименование товара' })
  name: string;

  @ApiPropertyOptional({ description: 'Идентификатор товара в ИС Клиента' })
  ware_key?: string;

  @ApiPropertyOptional({ description: 'Маркировка товара' })
  marking?: string;

  @ApiPropertyOptional({
    description: 'Оплата за товар',
    type: PaymentDto,
  })
  @ValidateNested()
  @Type(() => PaymentDto)
  payment?: PaymentDto;

  @ApiPropertyOptional({ description: 'Вес товара в граммах' })
  weight?: number;

  @ApiPropertyOptional({ description: 'Вес брутто товара в граммах' })
  weight_gross?: number;

  @ApiPropertyOptional({ description: 'Количество единиц товара' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Количество товара к доставке' })
  delivery_amount?: number;

  @ApiPropertyOptional({
    description: 'Наименование товара на иностранном языке',
  })
  name_i18n?: string;

  @ApiPropertyOptional({ description: 'Бренд товара' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Код страны производства' })
  country_code?: string;

  @ApiPropertyOptional({ description: 'Материал товара' })
  material?: string;

  @ApiPropertyOptional({ description: 'Содержит wifi/gsm' })
  @IsBoolean()
  wifi_gsm?: boolean;

  @ApiPropertyOptional({ description: 'Ссылка на сайт интернет-магазина' })
  url?: string;

  @ApiPropertyOptional({
    description: 'Истинный продавец',
    type: SellerDto,
  })
  @ValidateNested()
  @Type(() => SellerDto)
  seller?: SellerDto;

  @ApiPropertyOptional({ description: 'Подакцизный товар' })
  @IsBoolean()
  excise?: boolean;

  @ApiPropertyOptional({ description: 'Объявленная стоимость товара' })
  cost?: number;

  @ApiPropertyOptional({ description: 'Код ТН ВЭД ЕАЭС' })
  feacn_code?: string;

  @ApiPropertyOptional({ description: 'УИН ювелирного изделия' })
  jewel_uin?: string;

  @ApiPropertyOptional({ description: 'Товар бывший в употреблении' })
  @IsBoolean()
  used?: boolean;
}

export class PackageServiceDto {
  @ApiProperty({ description: 'Код дополнительной услуги' })
  code: string;
}

export class PackageDto {
  @ApiPropertyOptional({ description: 'Номер упаковки' })
  number?: string;

  @ApiPropertyOptional({ description: 'Штрих-код упаковки' })
  barcode?: string;

  @ApiPropertyOptional({ description: 'Общий вес упаковки в граммах' })
  weight?: number;

  @ApiPropertyOptional({ description: 'Длина упаковки в сантиметрах' })
  length?: number;

  @ApiPropertyOptional({ description: 'Ширина упаковки в сантиметрах' })
  width?: number;

  @ApiPropertyOptional({ description: 'Объемный вес упаковки в граммах' })
  weight_volume?: number;

  @ApiPropertyOptional({ description: 'Расчетный вес упаковки в граммах' })
  weight_calc?: number;

  @ApiPropertyOptional({ description: 'Высота упаковки в сантиметрах' })
  height?: number;

  @ApiPropertyOptional({ description: 'Комментарий к упаковке' })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Товары в упаковке',
    type: [ItemDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items?: ItemDto[];

  @ApiPropertyOptional({
    description: 'Дополнительные услуги упаковки',
    type: [PackageServiceDto],
  })
  @ValidateNested({ each: true })
  @Type(() => PackageServiceDto)
  services?: PackageServiceDto[];

  @ApiPropertyOptional({ description: 'Идентификатор упаковки' })
  package_id?: string;
}

export class StatusDto {
  @ApiPropertyOptional({ description: 'Код статуса' })
  code?: string;

  @ApiPropertyOptional({ description: 'Название статуса' })
  name?: string;

  @ApiPropertyOptional({ description: 'Дата и время установки статуса' })
  @IsDateString()
  date_time?: string;

  @ApiPropertyOptional({ description: 'Код причины' })
  reason_code?: string;

  @ApiPropertyOptional({ description: 'Название города' })
  city?: string;

  @ApiPropertyOptional({ description: 'Уникальный идентификатор города' })
  city_uuid?: string;

  @ApiPropertyOptional({ description: 'Статус удален' })
  @IsBoolean()
  deleted?: boolean;
}

export class PaymentInfoDto {
  @ApiProperty({
    description: 'Тип оплаты',
    enum: ['CASH', 'CARD'],
  })
  type: string;

  @ApiProperty({ description: 'Сумма к доплате' })
  sum: number;
}

export class DeliveryDetailDto {
  @ApiPropertyOptional({ description: 'Дата доставки' })
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'ФИО получившего груз' })
  recipient_name?: string;

  @ApiPropertyOptional({ description: 'Сумма к доплате' })
  payment_sum?: number;

  @ApiPropertyOptional({ description: 'Стоимость доставки' })
  delivery_sum?: number;

  @ApiPropertyOptional({ description: 'Итоговая сумма' })
  total_sum?: number;

  @ApiPropertyOptional({
    description: 'Информация по оплате',
    type: [PaymentInfoDto],
  })
  @ValidateNested({ each: true })
  @Type(() => PaymentInfoDto)
  payment_info?: PaymentInfoDto[];

  @ApiPropertyOptional({ description: 'Ставка НДС для доставки' })
  delivery_vat_rate?: number;

  @ApiPropertyOptional({ description: 'Сумма НДС для доставки' })
  delivery_vat_sum?: number;

  @ApiPropertyOptional({
    description: 'Размер скидки для доставки в процентах',
  })
  delivery_discount_percent?: number;

  @ApiPropertyOptional({ description: 'Размер скидки для доставки в валюте' })
  delivery_discount_sum?: number;
}

export class OrderEntityDto {
  @ApiProperty({ description: 'Идентификатор заказа в ИС СДЭК' })
  uuid: string;

  @ApiPropertyOptional({ description: 'Тип заказа' })
  type?: number;

  @ApiPropertyOptional({ description: 'Дополнительные типы заказа' })
  @IsArray()
  additional_order_types?: number[];

  @ApiPropertyOptional({ description: 'Признак возвратного заказа' })
  @IsBoolean()
  is_return?: boolean;

  @ApiPropertyOptional({ description: 'Признак реверсного заказа' })
  @IsBoolean()
  is_reverse?: boolean;

  @ApiPropertyOptional({ description: 'Номер заказа СДЭК' })
  cdek_number?: string;

  @ApiPropertyOptional({ description: 'Номер заказа в ИС Клиента' })
  number?: string;

  @ApiPropertyOptional({ description: 'Сопроводительный номер' })
  accompanying_number?: string;

  @ApiPropertyOptional({ description: 'Код тарифа' })
  tariff_code?: number;

  @ApiPropertyOptional({ description: 'Комментарий к заказу' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Код пункта отправки' })
  shipment_point?: string;

  @ApiPropertyOptional({ description: 'Код пункта назначения' })
  delivery_point?: string;

  @ApiPropertyOptional({ description: 'Дата инвойса' })
  @IsDateString()
  date_invoice?: string;

  @ApiPropertyOptional({ description: 'Дата бесплатного хранения' })
  @IsDateString()
  keep_free_until?: string;

  @ApiPropertyOptional({ description: 'Наименование отправителя' })
  shipper_name?: string;

  @ApiPropertyOptional({ description: 'Адрес отправителя' })
  shipper_address?: string;

  @ApiPropertyOptional({
    description: 'Отправитель',
    type: ContactDto,
  })
  @ValidateNested()
  @Type(() => ContactDto)
  sender?: ContactDto;

  @ApiPropertyOptional({
    description: 'Получатель',
    type: ContactDto,
  })
  @ValidateNested()
  @Type(() => ContactDto)
  recipient?: ContactDto;

  @ApiPropertyOptional({
    description: 'Адрес отправления',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  from_location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Адрес получения',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  to_location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Дополнительные услуги',
    type: [ServiceDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];

  @ApiPropertyOptional({
    description: 'Список упаковок заказа',
    type: [PackageDto],
  })
  @ValidateNested({ each: true })
  @Type(() => PackageDto)
  packages?: PackageDto[];

  @ApiPropertyOptional({
    description: 'Статусы заказа',
    type: [StatusDto],
  })
  @ValidateNested({ each: true })
  @Type(() => StatusDto)
  statuses?: StatusDto[];

  @ApiPropertyOptional({ description: 'Признак клиентского возврата' })
  @IsBoolean()
  is_client_return?: boolean;

  @ApiPropertyOptional({ description: 'Режим доставки' })
  delivery_mode?: string;

  @ApiPropertyOptional({ description: 'Наличие реверсного заказа' })
  @IsBoolean()
  has_reverse_order?: boolean;

  @ApiPropertyOptional({ description: 'Планируемая дата доставки' })
  @IsDateString()
  planned_delivery_date?: string;

  @ApiPropertyOptional({
    description: 'Информация о доставке',
    type: DeliveryDetailDto,
  })
  @ValidateNested()
  @Type(() => DeliveryDetailDto)
  delivery_detail?: DeliveryDetailDto;

  @ApiPropertyOptional({ description: 'Проведена ли оплата' })
  @IsBoolean()
  transacted_payment?: boolean;

  @ApiPropertyOptional({ description: 'Ключ разработчика' })
  developer_key?: string;
}

export class ErrorDto {
  @ApiPropertyOptional({ description: 'Код ошибки' })
  code?: string;

  @ApiPropertyOptional({ description: 'Дополнительный код ошибки' })
  additional_code?: string;

  @ApiProperty({ description: 'Описание ошибки' })
  message: string;
}

export class WarningDto {
  @ApiPropertyOptional({ description: 'Код предупреждения' })
  code?: string;

  @ApiProperty({ description: 'Описание предупреждения' })
  message: string;
}

export class RequestDto {
  @ApiProperty({ description: 'Идентификатор запроса' })
  request_uuid: string;

  @ApiPropertyOptional({ description: 'Тип запроса' })
  type?: string;

  @ApiPropertyOptional({ description: 'Дата и время запроса' })
  @IsDateString()
  date_time?: string;

  @ApiPropertyOptional({ description: 'Состояние запроса' })
  state?: string;

  @ApiPropertyOptional({
    description: 'Ошибки',
    type: [ErrorDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ErrorDto)
  errors?: ErrorDto[];

  @ApiPropertyOptional({
    description: 'Предупреждения',
    type: [WarningDto],
  })
  @ValidateNested({ each: true })
  @Type(() => WarningDto)
  warnings?: WarningDto[];
}

export class RelatedEntityDto {
  @ApiProperty({ description: 'Идентификатор связанной сущности' })
  uuid: string;

  @ApiPropertyOptional({ description: 'Тип связанной сущности' })
  type?: string;

  @ApiPropertyOptional({ description: 'Ссылка на связанную сущность' })
  url?: string;

  @ApiPropertyOptional({ description: 'Время создания' })
  @IsDateString()
  create_time?: string;

  @ApiPropertyOptional({ description: 'Номер заказа СДЭК' })
  cdek_number?: string;

  @ApiPropertyOptional({ description: 'Дата' })
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Время начала' })
  time_from?: string;

  @ApiPropertyOptional({ description: 'Время окончания' })
  time_to?: string;
}

export class OrderInfoResponseDto {
  @ApiProperty({
    description: 'Информация о заказе',
    type: OrderEntityDto,
  })
  @ValidateNested()
  @Type(() => OrderEntityDto)
  entity: OrderEntityDto;

  @ApiPropertyOptional({
    description: 'Запросы',
    type: [RequestDto],
  })
  @ValidateNested({ each: true })
  @Type(() => RequestDto)
  requests?: RequestDto[];

  @ApiPropertyOptional({
    description: 'Связанные сущности',
    type: [RelatedEntityDto],
  })
  @ValidateNested({ each: true })
  @Type(() => RelatedEntityDto)
  related_entities?: RelatedEntityDto[];
}
