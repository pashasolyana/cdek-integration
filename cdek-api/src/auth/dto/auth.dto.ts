import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  IsOptional,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const PHONE_HINT =
  'Некорректный формат номера телефона. Используйте: +7(916)232-12-75, 89162321275 или 79162321275';

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsNotEmpty({ message: 'Фамилия обязательна' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректная почта' })
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsString({ message: 'Номер телефона должен быть строкой' })
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    { message: PHONE_HINT },
  )
  phone: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/(?=.*[a-zа-яё])/, { message: 'Нужна хотя бы одна строчная буква' })
  @Matches(/(?=.*[A-ZА-ЯЁ])/, { message: 'Нужна хотя бы одна заглавная буква' })
  @Matches(/(?=.*\d)/, { message: 'Нужна хотя бы одна цифра' })
  @Matches(/(?=.*[^0-9A-Za-zА-Яа-яЁё_\s])/, {
    message: 'Нужен хотя бы один спецсимвол',
  })
  password: string;
}

export class RegisterCompanyDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  companyType: string; // "ООО" | "ИП"

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  companyName: string;

  // ИНН: 10 (юр.лица) или 12 (ИП)
  @IsNotEmpty()
  @Matches(/^\d{10}$|^\d{12}$/, {
    message: 'ИНН должен содержать 10 или 12 цифр',
  })
  inn: string;

  // КПП: 9 цифр, только для ООО — поэтому опционально
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'КПП должен содержать 9 цифр' })
  kpp?: string;

  // ОГРН: 13 (юр.лица) или 15 (ИП)
  @IsNotEmpty()
  @Matches(/^\d{13}$|^\d{15}$/, {
    message: 'ОГРН должен содержать 13 или 15 цифр',
  })
  ogrn: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректная почта организации' })
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    { message: PHONE_HINT },
  )
  phone?: string;

  @IsNotEmpty()
  @Matches(/^\d{9}$/, { message: 'БИК должен содержать 9 цифр' })
  bik: string;

  @IsNotEmpty()
  @Matches(/^\d{20}$/, { message: 'Расчётный счёт должен содержать 20 цифр' })
  settlementAccount: string;

  @IsNotEmpty()
  @Matches(/^\d{20}$/, { message: 'Корр. счёт должен содержать 20 цифр' })
  correspondentAccount: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  actualAddress: string;

  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Индекс должен содержать 6 цифр' })
  legalIndex: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  legalCity: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  legalAddress: string;
}

// Упрощенная регистрация (без компании)
export class RegisterDto {
  @IsNotEmpty({ message: 'Имя обязательно' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsNotEmpty({ message: 'Фамилия обязательна' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsOptional()
  @IsEmail({}, { message: 'Некорректная почта' })
  @Transform(({ value }) => value?.trim())
  email?: string;

  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsString({ message: 'Номер телефона должен быть строкой' })
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    { message: PHONE_HINT },
  )
  phone: string;

  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(/(?=.*[a-zа-яё])/, { message: 'Нужна хотя бы одна строчная буква' })
  @Matches(/(?=.*[A-ZА-ЯЁ])/, { message: 'Нужна хотя бы одна заглавная буква' })
  @Matches(/(?=.*\d)/, { message: 'Нужна хотя бы одна цифра' })
  @Matches(/(?=.*[^0-9A-Za-zА-Яа-яЁё_\s])/, {
    message: 'Нужен хотя бы один спецсимвол',
  })
  password: string;
}

// DTO для запроса кода подтверждения при регистрации
export class RegisterSendCodeDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    { message: PHONE_HINT },
  )
  phone: string;
}

// DTO для верификации кода при регистрации
export class RegisterVerifyCodeDto {
  @IsNotEmpty({ message: 'Номер телефона обязателен' })
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    { message: PHONE_HINT },
  )
  phone: string;

  @IsNotEmpty({ message: 'Код обязателен' })
  @Matches(/^\d{6}$/, { message: 'Код должен состоять из 6 цифр' })
  code: string;
}

// DTO для создания/обновления компании в личном кабинете
export class UpsertCompanyDto extends RegisterCompanyDto {}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    { message: PHONE_HINT },
  )
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  password: string;
}

export class RefreshTokenDto {
  @IsNotEmpty({ message: 'Refresh token обязателен' })
  @IsString({ message: 'Refresh token должен быть строкой' })
  refreshToken: string;
}

export class ForgotStartDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    {
      message: 'Некорректный формат номера телефона',
    },
  )
  phone!: string;
}

export class ForgotVerifyDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(
    /^(\+?7|8)[\s\-\(\)]?\d{3}[\s\-\(\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$|^[78]\d{10}$/,
    {
      message: 'Некорректный формат номера телефона',
    },
  )
  phone!: string;

  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: 'Код должен состоять из 6 цифр' })
  code!: string;
}

export class ForgotResetDto extends ForgotVerifyDto {
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(
    /^(?=.*[a-zа-яё])(?=.*[A-ZА-ЯЁ])(?=.*\d)(?=.*[^0-9A-Za-zА-Яа-яЁё_\s]).+$/,
    {
      message:
        'Пароль должен содержать заглавные, строчные буквы, цифры и спецсимвол',
    },
  )
  newPassword!: string;
}
