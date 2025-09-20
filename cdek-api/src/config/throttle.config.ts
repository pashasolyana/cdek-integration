import { ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 секунда
        limit: 3,  // 3 запроса в секунду
      },
      {
        name: 'medium',
        ttl: 10000, // 10 секунд
        limit: 20,  // 20 запросов в 10 секунд
      },
      {
        name: 'long',
        ttl: 60000, // 1 минута
        limit: 100, // 100 запросов в минуту
      }
    ]),
  ],
})
export class ThrottleConfigModule {}