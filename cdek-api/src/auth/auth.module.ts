import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

type MsLike = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

@Global()
@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const raw = configService.get<string>('JWT_EXPIRES_IN', '15m')!;
        // Если только цифры — трактуем как секунды (число).
        const expiresIn: number | MsLike = /^\d+$/.test(raw)
          ? Number(raw)
          : (raw as MsLike);

        return {
          secret: configService.get<string>('JWT_SECRET')!,
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, TokenService, JwtAuthGuard, JwtModule, PassportModule],
})
export class AuthModule {}
