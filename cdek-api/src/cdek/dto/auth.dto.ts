import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CdekAuthDto {
  @ApiProperty({
    description: 'Тип аутентификации. Всегда client_credentials',
    example: 'client_credentials',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  grant_type: string;

  @ApiProperty({
    description: 'Идентификатор клиента CDEK',
    example: 'wqGwiQx0gg8mLtiEKsUinjVSICCjtTEP',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({
    description: 'Секретный ключ клиента CDEK',
    example: 'RmAmgvSgSl1yirlz9QupbzOJVqhCxcP5',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  client_secret: string;
}

export interface CdekTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string | null;
  jti: string | null;
}