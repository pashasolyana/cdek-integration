import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @ApiOperation({
    summary: 'Проверка состояния приложения',
    description: 'Проверяет доступность приложения и подключения к базе данных',
  })
  @ApiResponse({
    status: 200,
    description: 'Приложение работает корректно',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        message: { type: 'string', example: 'Service is healthy' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        database: { type: 'string', example: 'connected' },
      },
    },
  })
  @Get()
  async checkHealth() {
    try {
      // Проверяем подключение к базе данных
      await this.prismaService.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Service is unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @ApiOperation({
    summary: 'Готовность приложения',
    description: 'Проверяет готовность приложения к обслуживанию запросов',
  })
  @ApiResponse({
    status: 200,
    description: 'Приложение готово к работе',
  })
  @Get('ready')
  async checkReadiness() {
    // Здесь можно добавить дополнительные проверки готовности
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({
    summary: 'Живость приложения',
    description: 'Проверяет, что приложение отвечает на запросы',
  })
  @ApiResponse({
    status: 200,
    description: 'Приложение живо',
  })
  @Get('live')
  async checkLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
