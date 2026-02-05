import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { ShortUrl } from '../entities/short-url.entity';
import { Sequence } from '../entities/sequence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ShortUrl, Sequence])],
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService],
})
export class UrlModule {}
