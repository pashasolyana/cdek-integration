import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [`'self'`, 'data:', 'https:'],
          scriptSrc: [
            `'self'`,
            `'unsafe-inline'`,
            'https://cdnjs.cloudflare.com',
          ],
          styleSrc: [
            `'self'`,
            `'unsafe-inline'`,
            'https://cdnjs.cloudflare.com',
          ],
        },
      },
    }),
  );

  // Cookie parser for JWT tokens
  app.use(cookieParser());

  // Глобальные настройки валидации
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formattedErrors = errors.reduce((accumulator, error) => {
          accumulator[error.property] = Object.values(error.constraints || {});
          return accumulator;
        }, {});

        const exception = new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });

        return exception;
      },
    }),
  );

  // Глобальный guard для авторизации
  // const jwtAuthGuard = app.get(JwtAuthGuard);
  // app.useGlobalGuards(jwtAuthGuard);

  // Устанавливаем глобальный префикс для всех API эндпоинтов
  app.setGlobalPrefix('api');

  // Настройка CORS с учетом безопасности
  const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true, // Важно для работы с cookies
  });

  // Настройка Swagger документации
  const config = new DocumentBuilder()
    .setTitle('CDEK Integration API')
    .setDescription(
      `
      API для интеграции с службой доставки CDEK с безопасной авторизацией.
      
      Основные возможности:
      - Безопасная авторизация пользователей (JWT + httpOnly cookies)
      - Авторизация в CDEK API
      - Создание и управление заказами
      - Получение информации о пунктах выдачи
      - Расчет стоимости доставки
      - Отслеживание статуса заказов
      
      Безопасность:
      - JWT токены с коротким временем жизни (15 минут)
      - Refresh токены для автоматического обновления
      - HttpOnly cookies для защиты от XSS
      - Rate limiting для защиты от атак
      - Helmet для безопасных заголовков
      - CORS настройки
    `,
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://github.com/your-repo',
      'support@yourdomain.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addCookieAuth('access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
      description: 'JWT Access Token in httpOnly cookie',
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000/api', 'Development server')
    .addServer('https://your-api-domain.com/api', 'Production server')
    .addTag('Auth', 'Endpoints для авторизации и регистрации')
    .addTag('CDEK API', 'Endpoints для работы с CDEK API')
    .addTag('Health', 'Проверка состояния сервиса')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'CDEK Integration API Documentation',
    customfavIcon: 'https://cdek.ru/favicon.ico',
  });

  // Настройка порта
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(
    `📚 Swagger documentation is available on: http://localhost:${port}/api-docs`,
  );
  logger.log(
    `🩺 Health check is available on: http://localhost:${port}/api/health`,
  );
  logger.log(`🔐 Auth endpoints: http://localhost:${port}/api/auth/*`);
  logger.log(
    `🗃️  Database admin is available on: http://localhost:8080 (if using docker-compose)`,
  );
  logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

  // В production логируем дополнительную информацию о безопасности
  if (process.env.NODE_ENV === 'production') {
    logger.log('🔒 Security features enabled:');
    logger.log('  - Helmet security headers');
    logger.log('  - CORS protection');
    logger.log('  - Rate limiting');
    logger.log('  - JWT with httpOnly cookies');
    logger.log('  - Input validation & sanitization');
  }
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});
