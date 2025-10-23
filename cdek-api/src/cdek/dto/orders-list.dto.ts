import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetOrdersListQueryDto {
  @ApiProperty({
    description: 'Количество записей для выборки (максимум 100)',
    required: false,
    default: 50,
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiProperty({
    description: 'Смещение для пагинации',
    required: false,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiProperty({
    description: 'Дата начала периода (ISO 8601)',
    required: false,
    example: '2024-09-01',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({
    description: 'Дата окончания периода (ISO 8601)',
    required: false,
    example: '2024-10-31',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({
    description: 'Код тарифа CDEK для фильтрации',
    required: false,
    example: 136,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tariffCode?: number;
}

export class OrdersListResponseDto {
  @ApiProperty({ description: 'Успешность запроса' })
  success: boolean;

  @ApiProperty({ description: 'Общее количество заказов' })
  total: number;

  @ApiProperty({ description: 'Массив заказов' })
  orders: any[];

  @ApiProperty({ description: 'Сообщение' })
  message: string;
}
