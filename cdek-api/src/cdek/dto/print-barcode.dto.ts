import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsUUID, Min, Max, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum BarcodeFormat {
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6',
  A7 = 'A7',
}

export enum BarcodeLanguage {
  RUS = 'RUS',
  ENG = 'ENG',
}

export class PrintBarcodeOrderDto {
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
}

export class PrintBarcodeRequestDto {
  @ApiProperty({
    description: 'Список заказов для печати ШК места (максимум 100)',
    type: [PrintBarcodeOrderDto],
    example: [
      { order_uuid: '72753031-3c87-4f7e-8fd9-c3d75c1d8b5f' },
      { cdek_number: 1106394409 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrintBarcodeOrderDto)
  orders: PrintBarcodeOrderDto[];

  @ApiProperty({
    description: 'Число копий. По умолчанию 1',
    required: false,
    default: 1,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  copy_count?: number = 1;

  @ApiProperty({
    description: 'Формат печати. По умолчанию A4',
    required: false,
    enum: BarcodeFormat,
    default: BarcodeFormat.A4,
    example: BarcodeFormat.A4,
  })
  @IsOptional()
  @IsEnum(BarcodeFormat)
  format?: BarcodeFormat = BarcodeFormat.A4;

  @ApiProperty({
    description: 'Язык печатной формы. По умолчанию RUS',
    required: false,
    enum: BarcodeLanguage,
    default: BarcodeLanguage.RUS,
    example: BarcodeLanguage.RUS,
  })
  @IsOptional()
  @IsEnum(BarcodeLanguage)
  lang?: BarcodeLanguage = BarcodeLanguage.RUS;
}

export class PrintBarcodeStatusDto {
  @ApiProperty({ description: 'Код статуса' })
  code: string;

  @ApiProperty({ description: 'Название статуса' })
  name: string;

  @ApiProperty({ description: 'Дата и время установки статуса' })
  date_time: string;
}

export class BarcodeDto {
  @ApiProperty({ description: 'Идентификатор ШК места' })
  uuid: string;

  @ApiProperty({ description: 'Список заказов', type: [PrintBarcodeOrderDto] })
  orders: PrintBarcodeOrderDto[];

  @ApiProperty({ description: 'Число копий' })
  copy_count?: number;

  @ApiProperty({ description: 'Формат печати', enum: BarcodeFormat })
  format?: string;

  @ApiProperty({ description: 'Язык печатной формы', enum: BarcodeLanguage })
  lang?: string;

  @ApiProperty({ 
    description: 'Ссылка на скачивание файла (доступна только в статусе READY)',
    required: false,
  })
  url?: string;

  @ApiProperty({ description: 'Статусы ШК места', type: [PrintBarcodeStatusDto] })
  statuses: PrintBarcodeStatusDto[];

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

export class PrintBarcodeResponseDto {
  @ApiProperty({ description: 'Успешность операции' })
  success: boolean;

  @ApiProperty({ description: 'Информация о ШК места', required: false })
  entity?: BarcodeDto;

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
