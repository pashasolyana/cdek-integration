import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CdekController } from './cdek.controller';
import { CdekService } from './cdek.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CdekController],
  providers: [CdekService],
  exports: [CdekService],
})
export class CdekModule {}
