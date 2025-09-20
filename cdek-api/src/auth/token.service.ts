import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: number; // user id
  phone: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Генерирует пару токенов (access + refresh)
   */
  async generateTokens(userId: number, phone: string): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: userId,
      phone,
    };

    // Генерируем access token (короткоживущий)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    // Генерируем refresh token (долгоживущий)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    
    // Парсим время жизни refresh токена
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней по умолчанию

    // Сохраняем refresh token в БД
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Проверяет валидность access токена
   */
  async validateAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверяет валидность refresh токена
   */
  async validateRefreshToken(token: string): Promise<{ userId: number; phone: string } | null> {
    try {
      const refreshToken = await this.prisma.refreshToken.findFirst({
        where: {
          token,
          isRevoked: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              isActive: true,
            },
          },
        },
      });

      if (!refreshToken || !refreshToken.user.isActive) {
        return null;
      }

      return {
        userId: refreshToken.user.id,
        phone: refreshToken.user.phone,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Обновляет токены по refresh токену
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const validationResult = await this.validateRefreshToken(refreshToken);
    
    if (!validationResult) {
      return null;
    }

    // Аннулируем старый refresh token
    await this.revokeRefreshToken(refreshToken);

    // Генерируем новую пару токенов
    return this.generateTokens(validationResult.userId, validationResult.phone);
  }

  /**
   * Аннулирует refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  /**
   * Аннулирует все refresh токены пользователя (при выходе со всех устройств)
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Очищает истекшие refresh токены
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
  }

  /**
   * Извлекает payload из токена без проверки
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}