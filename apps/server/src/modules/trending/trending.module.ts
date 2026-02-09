import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NostrEvent, NostrProfile } from '../../entities';
import { TrendingService } from './trending.service';
import { TrendingController } from './trending.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NostrEvent, NostrProfile])],
  controllers: [TrendingController],
  providers: [TrendingService],
  exports: [TrendingService],
})
export class TrendingModule {}
