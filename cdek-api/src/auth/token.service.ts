import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import ms from 'ms';

type MsInput = Parameters<typeof ms>[0];
type MsStringValue = Extract<MsInput, string>;

const DEFAULT_ACCESS_TTL: MsStringValue = '15m';
const DEFAULT_REFRESH_TTL: MsStringValue = '7d';

const MS_UNITS = new Set<string>([
  'y',
  'yr',
  'yrs',
  'year',
  'years',
  'w',
  'week',
  'weeks',
  'd',
  'day',
  'days',
  'h',
  'hr',
  'hrs',
  'hour',
  'hours',
  'm',
  'min',
  'mins',
  'minute',
  'minutes',
  's',
  'sec',
  'secs',
  'second',
  'seconds',
  'ms',
  'msec',
  'msecs',
  'millisecond',
  'milliseconds',
]);

const isMsStringValue = (value: string): value is MsStringValue => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (/^\d+$/u.test(trimmed)) {
    return true;
  }

  const match = trimmed.match(/^(\d+)\s*([a-zA-Z]+)$/u);
  if (!match) {
    return false;
  }

  return MS_UNITS.has(match[2].toLowerCase());
};

const toJwtExpiresIn = (
  value: string | number | undefined,
  fallback: JwtSignOptions['expiresIn'],
): JwtSignOptions['expiresIn'] => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }

    if (/^\d+$/u.test(trimmed)) {
      return Number(trimmed);
    }

    if (isMsStringValue(trimmed)) {
      return trimmed;
    }
  }

  return fallback;
};

const resolveRefreshTtlMs = (value: string | number | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value * 1000;
  }

  if (typeof value === 'string' && isMsStringValue(value)) {
    return ms(value);
  }

  return ms(DEFAULT_REFRESH_TTL);
};

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
    const accessTokenTtl = this.configService.get<string | number>(
      'JWT_EXPIRES_IN',
      DEFAULT_ACCESS_TTL,
    );
    const accessTokenExpiresIn = toJwtExpiresIn(
      accessTokenTtl,
      DEFAULT_ACCESS_TTL,
    );

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: accessTokenExpiresIn,
    });

    // Генерируем refresh token (долгоживущий)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshExpiresIn = this.configService.get<string | number>(
      'JWT_REFRESH_EXPIRES_IN',
      DEFAULT_REFRESH_TTL,
    );

    const refreshTtlMs = resolveRefreshTtlMs(refreshExpiresIn);

    const expiresAt = new Date(Date.now() + refreshTtlMs);

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
  async validateRefreshToken(
    token: string,
  ): Promise<{ userId: number; phone: string } | null> {
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
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
  }

  /**
   * Извлекает payload из токена без проверки
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token);
    } catch (error) {
      return null;
    }
  }
}
