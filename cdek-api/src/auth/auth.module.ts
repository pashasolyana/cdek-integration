import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CdekModule } from './cdek/cdek.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DadataModule } from './dadata/dadata.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Глобальная конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting для защиты от злоупотреблений
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 секунда
        limit: 10, // 10 запросов в секунду
      },
      {
        name: 'medium',
        ttl: 10000, // 10 секунд
        limit: 100, // 100 запросов в 10 секунд
      },
      {
        name: 'long',
        ttl: 60000, // 1 минута
        limit: 1000, // 1000 запросов в минуту
      },
      {
        name: 'auth',
        ttl: 900000, // 15 минут
        limit: 5, // Только 5 попыток входа в 15 минут
      },
    ]),

    // Основные модули
    PrismaModule,
    AuthModule,
    CdekModule,
    DadataModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Глобальный guard для rate limiting - ОТКЛЮЧЕН
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}