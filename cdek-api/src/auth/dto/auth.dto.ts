import { IsString, IsPhoneNumber, MinLength, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsString({ message: 'Номер телефона должен быть строкой' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/, {
    message: 'Некорректный формат номера телефона. Используйте: +7(916)232-12-75, 89162321275 или 79162321275'
  })
  phone: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password: string;
}

export class RegisterDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsString({ message: 'Номер телефона должен быть строкой' })
  @Transform(({ value }) => value?.trim())
  @Matches(/^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/, {
    message: 'Некорректный формат номера телефона. Используйте: +7(916)232-12-75, 89162321275 или 79162321275'
  })
  phone: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать минимум одну заглавную букву, одну строчную букву и одну цифру'
  })
  password: string;
}

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token обязателен' })
  @IsString({ message: 'Refresh token должен быть строкой' })
  refreshToken: string;
}