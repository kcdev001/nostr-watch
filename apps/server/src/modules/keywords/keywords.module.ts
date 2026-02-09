import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Keyword } from '../../entities';
import { NostrModule } from '../nostr/nostr.module';
import { KeywordsService } from './keywords.service';
import { KeywordsController } from './keywords.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Keyword]),
    forwardRef(() => NostrModule),
  ],
  controllers: [KeywordsController],
  providers: [KeywordsService],
  exports: [KeywordsService],
})
export class KeywordsModule {}
