import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

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
  ) {}

  /**
   * Регистрация нового пользователя
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { phone, password } = registerDto;

    // Нормализуем номер телефона
    const normalizedPhone = this.normalizePhone(phone);

    // Проверяем, не существует ли пользователь с таким номером
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким номером телефона уже существует');
    }

    // Хешируем пароль
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const user = await this.prisma.user.create({
      data: {
        phone: normalizedPhone,
        password: hashedPassword,
      },
      select: {
        id: true,
        phone: true,
        createdAt: true,
      },
    });

    // Генерируем токены
    const tokens = await this.tokenService.generateTokens(user.id, user.phone);

    return {
      user,
      ...tokens,
    };
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
}