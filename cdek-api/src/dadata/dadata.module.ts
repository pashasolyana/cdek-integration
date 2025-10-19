import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DadataService } from './dadata.service';
import { DadataController } from './dadata.controller';

@Module({
  imports: [ConfigModule],
  controllers: [DadataController],
  providers: [DadataService],
  exports: [DadataService],
})
export class DadataModule {}
