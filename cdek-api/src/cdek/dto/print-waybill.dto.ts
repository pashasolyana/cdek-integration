import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsUUID, Min, Max, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum WaybillType {
  TPL_CHINA = 'tpl_china',
  TPL_ARMENIA = 'tpl_armenia',
  TPL_RUSSIA = 'tpl_russia',
  TPL_ENGLISH = 'tpl_english',
  TPL_ITALIAN = 'tpl_italian',
  TPL_KOREAN = 'tpl_korean',
  TPL_LATVIAN = 'tpl_latvian',
  TPL_LITHUANIAN = 'tpl_lithuanian',
  TPL_GERMAN = 'tpl_german',
  TPL_TURKISH = 'tpl_turkish',
  TPL_CZECH = 'tpl_czech',
  TPL_THAILAND = 'tpl_thailand',
  TPL_INVOICE = 'tpl_invoice',
}

export class PrintOrderDto {
  @ApiProperty({
    description: 'Идентификатор заказа в ИС СДЭК (UUID). Обязателен, если не указан cdek_number',
    required: false,
    example: '72753031-3c87-4f7e-8fd9-c3d75c1d8b5f',
  })
  @IsOptional()
  @IsUUID()
  order_uuid?: string;

  @ApiProperty({
    description: 'Номер заказа СДЭК. Обязателен, если не указан order_uuid',
    required: false,
    example: 1106394409,
  })
  @IsOptional()
  @IsInt()
  cdek_number?: number;

  @ApiProperty({
    description: 'Число копий одной квитанции на листе',
    required: false,
    default: 2,
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  copy_count?: number = 2;
}

export class PrintWaybillRequestDto {
  @ApiProperty({
    description: 'Список заказов для печати (максимум 100)',
    type: [PrintOrderDto],
    example: [
      { order_uuid: '72753031-3c87-4f7e-8fd9-c3d75c1d8b5f', copy_count: 2 },
      { cdek_number: 1106394409, copy_count: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintOrderDto)
  orders: PrintOrderDto[];

  @ApiProperty({
    description: 'Форма квитанции. По умолчанию tpl_russia',
    required: false,
    enum: WaybillType,
    default: WaybillType.TPL_RUSSIA,
    example: WaybillType.TPL_RUSSIA,
  })
  @IsOptional()
  @IsEnum(WaybillType)
  type?: WaybillType = WaybillType.TPL_RUSSIA;
}

export class PrintStatusDto {
  @ApiProperty({ description: 'Код статуса' })
  code: string;

  @ApiProperty({ description: 'Название статуса' })
  name: string;

  @ApiProperty({ description: 'Дата и время установки статуса' })
  date_time: string;
}

export class WaybillDto {
  @ApiProperty({ description: 'Идентификатор квитанции к заказу' })
  uuid: string;

  @ApiProperty({ description: 'Список заказов', type: [PrintOrderDto] })
  orders: PrintOrderDto[];

  @ApiProperty({ description: 'Число копий одной квитанции на листе' })
  copy_count?: number;

  @ApiProperty({ description: 'Форма квитанции', enum: WaybillType })
  type?: string;

  @ApiProperty({ 
    description: 'Ссылка на скачивание файла (доступна только в статусе READY)',
    required: false,
  })
  url?: string;

  @ApiProperty({ description: 'Статусы квитанции', type: [PrintStatusDto] })
  statuses: PrintStatusDto[];

  @ApiProperty({ 
    description: 'PDF файл в формате Base64 (доступен только в статусе READY)',
    required: false,
  })
  pdfBase64?: string;

  @ApiProperty({ 
    description: 'PDF файл как Buffer (доступен только в статусе READY)',
    required: false,
  })
  pdfBuffer?: Buffer;
}

export class PrintWaybillResponseDto {
  @ApiProperty({ description: 'Успешность операции' })
  success: boolean;

  @ApiProperty({ description: 'Информация о квитанции', required: false })
  entity?: WaybillDto;

  @ApiProperty({ description: 'Ссылка на скачивание PDF', required: false })
  url?: string;

  @ApiProperty({ 
    description: 'PDF файл в формате Base64 (готов для скачивания на клиенте)', 
    required: false 
  })
  pdfBase64?: string;

  @ApiProperty({ description: 'Текущий статус формирования', required: false })
  status?: string;

  @ApiProperty({ description: 'Сообщение' })
  message: string;

  @ApiProperty({ description: 'Информация о запросах', required: false })
  requests?: any[];

  @ApiProperty({ description: 'Связанные сущности', required: false })
  related_entities?: any[];
}
