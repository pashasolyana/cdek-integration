import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { SmsService } from '../sms/sms.service';
import {
  ForgotResetDto,
  ForgotStartDto,
  ForgotVerifyDto,
  LoginDto,
  RegisterDto,
  RegisterSendCodeDto,
  RegisterVerifyCodeDto,
} from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomInt } from 'node:crypto';
export interface AuthResponse {
  user: {
    id: number;
    phone: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly smsService: SmsService,
  ) {}

  private readonly resetCodeTtlMs = 10 * 60_000; // 10 минут
  private readonly resetMaxAttempts = 5;

  /**
   * Регистрация нового пользователя (упрощенная, без компании)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const normalizedPhone = this.normalizePhone(registerDto.phone);

    // Проверяем, что код был верифицирован
    const verifiedCode = await this.prisma.passwordResetCode.findFirst({
      where: {
        phone: normalizedPhone,
        userId: null, // null для кодов регистрации
        isUsed: true,
        usedAt: { not: null },
      },
      orderBy: { usedAt: 'desc' },
    });

    if (!verifiedCode || verifiedCode.usedAt! < new Date(Date.now() - 5 * 60_000)) {
      throw new BadRequestException('Необходимо сначала подтвердить номер телефона');
    }

    // Проверяем уникальность телефона
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким номером телефона уже зарегистрирован');
    }

    // Хеш пароля
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          phone: normalizedPhone,
          email: registerDto.email,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          password: hashedPassword,
        },
      });

      // Удаляем использованный код
      await this.prisma.passwordResetCode.deleteMany({
        where: { phone: normalizedPhone, userId: null },
      });

      // Генерируем токены
      const tokens = await this.tokenService.generateTokens(user.id, user.phone);

      return {
        user: {
          id: user.id,
          phone: user.phone,
          createdAt: user.createdAt,
        },
        ...tokens,
      };
    } catch (e: any) {
      if (e.code === 'P2002') {
        const target = e.meta?.target;
        if (Array.isArray(target) && target.includes('phone')) {
          throw new ConflictException('Пользователь с таким номером телефона уже зарегистрирован');
        }
        if (Array.isArray(target) && target.includes('email')) {
          throw new ConflictException('Пользователь с такой почтой уже зарегистрирован');
        }
      }
      throw e;
    }
  }

  /**
   * Вход в систему
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { phone, password } = loginDto;

    // Нормализуем номер телефона
    const normalizedPhone = this.normalizePhone(phone);

    // Находим пользователя
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверяем активность пользователя
    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Генерируем токены
    const tokens = await this.tokenService.generateTokens(user.id, user.phone);

    return {
      user: {
        id: user.id,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /**
   * Обновление токенов
   */
  async refreshTokens(refreshToken: string): Promise<RefreshResponse> {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token не предоставлен');
    }

    const tokens = await this.tokenService.refreshTokens(refreshToken);

    if (!tokens) {
      throw new UnauthorizedException('Недействительный refresh token');
    }

    return tokens;
  }

  /**
   * Выход из системы (аннулирование токена)
   */
  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
  }

  /**
   * Выход со всех устройств
   */
  async logoutAll(userId: number): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
  }

  /**
   * Получение информации о текущем пользователе
   */
  async getCurrentUser(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    return user;
  }

  /**
   * Нормализация номера телефона к формату 8XXXXXXXXXX
   */
  private normalizePhone(phone: string): string {
    // Удаляем все символы кроме цифр
    let normalized = phone.replace(/[^\d]/g, '');

    // Если номер начинается с 7 и имеет 11 цифр, заменяем на 8
    if (normalized.startsWith('7') && normalized.length === 11) {
      normalized = '8' + normalized.substring(1);
    }

    // Если номер имеет 10 цифр, добавляем 8 в начало
    if (normalized.length === 10) {
      normalized = '8' + normalized;
    }

    // Проверяем, что итоговый номер имеет правильный формат 8XXXXXXXXXX
    if (!normalized.match(/^8\d{10}$/)) {
      throw new Error(`Некорректный формат номера телефона: ${phone}`);
    }

    return normalized;
  }

  /**
   * Валидация пользователя для Passport стратегии
   */
  async validateUser(userId: number): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async sendPasswordResetCode(dto: ForgotStartDto): Promise<string | void> {
    const normalizedPhone = this.normalizePhone(dto.phone);

    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    // Не раскрываем существование аккаунта
    if (!user) return;

    const code = randomInt(100_000, 1_000_000).toString(); // 6-значный
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.resetCodeTtlMs);

    await this.prisma.$transaction(async (tx) => {
      // Сносим старые активные коды
      await tx.passwordResetCode.deleteMany({
        where: {
          userId: user.id,
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
      });

      await tx.passwordResetCode.create({
        data: {
          userId: user.id,
          phone: normalizedPhone,
          codeHash,
          attempts: 0,
          expiresAt,
        },
      });
    });

    // TODO: интеграция с SMS-провайдером
    // await this.smsService.send(normalizedPhone, `Код для сброса пароля: ${code}`);
    // В dev можно логировать:

    return `[DEV] reset code for ${normalizedPhone}: ${code}`;
  }

  /** Проверка кода без смены пароля (опциональный промежуточный шаг) */
  async verifyPasswordResetCode(dto: ForgotVerifyDto): Promise<void> {
    const normalizedPhone = this.normalizePhone(dto.phone);
    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });
    if (!user) {
      // одинаковая ошибка, чтобы не раскрывать наличие пользователя
      throw new UnauthorizedException('Неверный код или истёк срок действия');
    }

    const record = await this.prisma.passwordResetCode.findFirst({
      where: { userId: user.id, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !record ||
      record.expiresAt < new Date() ||
      record.attempts >= this.resetMaxAttempts
    ) {
      throw new UnauthorizedException('Неверный код или истёк срок действия');
    }

    // инкремент попытки и сравнение
    const ok = await bcrypt.compare(dto.code, record.codeHash);
    await this.prisma.passwordResetCode.update({
      where: { id: record.id },
      data: {
        attempts: record.attempts + 1,
        isUsed: ok ? true : record.isUsed,
        usedAt: ok ? new Date() : null,
      },
    });

    if (!ok) {
      throw new UnauthorizedException('Неверный код или истёк срок действия');
    }
  }

  async generateNewPasswordByCode(
    dto: ForgotVerifyDto,
  ): Promise<{ password: string }> {
    const normalizedPhone = this.normalizePhone(dto.phone);

    const user = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });
    if (!user) {
      // не раскрываем существование аккаунта
      throw new UnauthorizedException('Неверный код или истёк срок действия');
    }

    const record = await this.prisma.passwordResetCode.findFirst({
      where: { userId: user.id, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !record ||
      record.expiresAt < new Date() ||
      record.attempts >= this.resetMaxAttempts
    ) {
      throw new UnauthorizedException('Неверный код или истёк срок действия');
    }

    const ok = await bcrypt.compare(dto.code, record.codeHash);

    // фиксируем попытку сразу
    await this.prisma.passwordResetCode.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 },
    });

    if (!ok) {
      throw new UnauthorizedException('Неверный код или истёк срок действия');
    }

    // генерируем временный сильный пароль и сохраняем его хэш
    const newPassword = this.generateStrongPassword(12);
    const newHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });

      await tx.passwordResetCode.update({
        where: { id: record.id },
        data: { isUsed: true, usedAt: new Date() },
      });

      // отзываем все refresh-токены
      await tx.refreshToken.deleteMany({ where: { userId: user.id } });
    });

    // здесь можно отправить пароль по SMS/e-mail вместо возврата в ответе
    // await this.smsService.send(normalizedPhone, `Ваш новый пароль: ${newPassword}`);

    return { password: newPassword };
  }

  /** Приватный генератор сильного пароля (Upper/Lower/Digit/Special) */
  private generateStrongPassword(len = 12): string {
    const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // без I,O
    const L = 'abcdefghijkmnpqrstuvwxyz'; // без l,o
    const D = '23456789'; // без 0,1
    const S = '!@#$%^&*?_+-';

    const pick = (set: string, n = 1) =>
      Array.from({ length: n }, () => set[randomBytes(1)[0] % set.length]);

    // гарантируем все категории
    const must = [...pick(U), ...pick(L), ...pick(D), ...pick(S)];

    // добиваем длину случайными из общего пула
    const pool = U + L + D + S;
    const rest = Array.from(
      { length: Math.max(len - must.length, 0) },
      () => pool[randomBytes(1)[0] % pool.length],
    );

    // перемешиваем Фишером–Йетсом
    const all = [...must, ...rest];
    for (let i = all.length - 1; i > 0; i--) {
      const j = randomBytes(1)[0] % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.join('');
  }

  /**
   * Отправка кода подтверждения для регистрации
   */
  async sendRegistrationCode(dto: RegisterSendCodeDto): Promise<string | void> {
    const normalizedPhone = this.normalizePhone(dto.phone);

    // Проверяем, не зарегистрирован ли уже пользователь
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким номером телефона уже зарегистрирован');
    }

    const code = randomInt(100_000, 1_000_000).toString(); // 6-значный код
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + this.resetCodeTtlMs);

    // Создаем запись кода (используем userId = null для регистрации)
    await this.prisma.$transaction(async (tx) => {
      // Удаляем старые коды для этого телефона
      await tx.passwordResetCode.deleteMany({
        where: { phone: normalizedPhone, userId: null },
      });

      // Создаем новый код
      await tx.passwordResetCode.create({
        data: {
          userId: null, // null для регистрации (пользователя еще нет)
          phone: normalizedPhone,
          codeHash,
          expiresAt,
        },
      });
    });

    // Отправляем SMS
    try {
      await this.smsService.sendSms(normalizedPhone, code);
    } catch (error) {
      // В dev-режиме возвращаем код
      if (process.env.NODE_ENV === 'development') {
        return `[DEV] registration code for ${normalizedPhone}: ${code}`;
      }
      throw error;
    }

    // В dev возвращаем код для удобства
    if (process.env.NODE_ENV === 'development') {
      return `[DEV] registration code for ${normalizedPhone}: ${code}`;
    }
  }

  /**
   * Верификация кода для регистрации (не создает пользователя)
   */
  async verifyRegistrationCode(dto: RegisterVerifyCodeDto): Promise<void> {
    const normalizedPhone = this.normalizePhone(dto.phone);

    const record = await this.prisma.passwordResetCode.findFirst({
      where: { phone: normalizedPhone, userId: null, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (
      !record ||
      record.expiresAt < new Date() ||
      record.attempts >= this.resetMaxAttempts
    ) {
      throw new BadRequestException('Код истёк или неверен');
    }

    const ok = await bcrypt.compare(dto.code, record.codeHash);

    await this.prisma.passwordResetCode.update({
      where: { id: record.id },
      data: {
        attempts: record.attempts + 1,
        isUsed: ok ? true : record.isUsed,
        usedAt: ok ? new Date() : null,
      },
    });

    if (!ok) {
      throw new BadRequestException('Неверный код');
    }
  }
}
