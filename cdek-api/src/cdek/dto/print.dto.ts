import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
  ValidateIf,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PrintOrderDto {
  @ApiPropertyOptional({ description: 'UUID заказа в ИС СДЭК' })
  @IsOptional()
  @IsUUID('4', { message: 'order_uuid должен быть валидным UUID v4' })
  order_uuid?: string;

  @ApiPropertyOptional({ description: 'Номер заказа СДЭК' })
  @IsOptional()
  @IsNumber({}, { message: 'cdek_number должен быть числом' })
  cdek_number?: number;
}

export enum PrintReceiptTemplate {
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

export enum PrintBarcodeFormat {
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6',
  A7 = 'A7',
}

export enum PrintBarcodeLang {
  RUS = 'RUS',
  ENG = 'ENG',
}

export class PrintReceiptRequestDto {
  @ApiProperty({ type: [PrintOrderDto], description: 'Список заказов для печати', minItems: 1 })
  @IsArray()
  @ArrayNotEmpty({ message: 'Необходимо указать хотя бы один заказ' })
  @ValidateNested({ each: true })
  @Type(() => PrintOrderDto)
  orders!: PrintOrderDto[];

  @ApiPropertyOptional({ description: 'Количество копий на листе', default: 2, minimum: 1 })
  @IsOptional()
  @IsInt({ message: 'copy_count должен быть целым числом' })
  @Min(1, { message: 'copy_count должен быть не меньше 1' })
  copy_count?: number;

  @ApiPropertyOptional({ enum: PrintReceiptTemplate, description: 'Шаблон квитанции' })
  @IsOptional()
  @IsEnum(PrintReceiptTemplate, { message: 'type имеет недопустимое значение' })
  type?: PrintReceiptTemplate;

  @ApiPropertyOptional({ description: 'Пересоздать квитанцию даже при наличии кэша', default: false })
  @IsOptional()
  @IsBoolean()
  refresh?: boolean;
}

export class PrintBarcodeRequestDto {
  @ApiProperty({ type: [PrintOrderDto], description: 'Список заказов для печати', minItems: 1 })
  @IsArray()
  @ArrayNotEmpty({ message: 'Необходимо указать хотя бы один заказ' })
  @ValidateNested({ each: true })
  @Type(() => PrintOrderDto)
  orders!: PrintOrderDto[];

  @ApiPropertyOptional({ description: 'Количество копий этикетки', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt({ message: 'copy_count должен быть целым числом' })
  @Min(1, { message: 'copy_count должен быть не меньше 1' })
  copy_count?: number;

  @ApiPropertyOptional({ enum: PrintBarcodeFormat, description: 'Формат печати', default: PrintBarcodeFormat.A4 })
  @IsOptional()
  @IsEnum(PrintBarcodeFormat, { message: 'format имеет недопустимое значение' })
  format?: PrintBarcodeFormat;

  @ApiPropertyOptional({ enum: PrintBarcodeLang, description: 'Язык печатной формы', default: PrintBarcodeLang.RUS })
  @IsOptional()
  @IsEnum(PrintBarcodeLang, { message: 'lang имеет недопустимое значение' })
  lang?: PrintBarcodeLang;

  @ApiPropertyOptional({ description: 'Пересоздать этикетку даже при наличии кэша', default: false })
  @IsOptional()
  @IsBoolean()
  refresh?: boolean;
}

export class PrintJobResponseDto {
  @ApiProperty({ description: 'UUID задания печати в CDEK' })
  uuid!: string;

  @ApiProperty({ description: 'Отпечаток параметров запроса (SHA-256)', example: 'f3ab...' })
  fingerprint!: string;

  @ApiProperty({ description: 'Тип печати', example: 'receipt' })
  kind!: 'receipt' | 'barcode';

  @ApiProperty({ description: 'Текущий статус задания', example: 'READY' })
  status!: string;

  @ApiPropertyOptional({ description: 'URL одноразовой ссылки от CDEK', nullable: true })
  downloadUrl?: string | null;

  @ApiPropertyOptional({ description: 'Путь до локального файла с результатом', nullable: true })
  filePath?: string | null;

  @ApiPropertyOptional({ description: 'Имя локального файла', nullable: true })
  fileName?: string | null;

  @ApiPropertyOptional({ description: 'Размер файла в байтах', nullable: true })
  fileSize?: number | null;

  @ApiPropertyOptional({ description: 'Признак, что использован ранее сохранённый файл', default: false })
  cached?: boolean;

  @ApiProperty({ description: 'Дата создания кэша', example: '2025-01-01T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ description: 'Дата последнего обновления кэша', example: '2025-01-01T12:00:00.000Z' })
  updatedAt!: string;
}

export type PrintJobKind = 'receipt' | 'barcode';