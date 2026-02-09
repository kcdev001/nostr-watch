import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NostrEvent, NostrProfile } from '../../entities';
import { KeywordsModule } from '../keywords/keywords.module';
import { NostrService } from './nostr.service';
import { NostrController } from './nostr.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NostrEvent, NostrProfile]),
    forwardRef(() => KeywordsModule),
  ],
  controllers: [NostrController],
  providers: [NostrService],
  exports: [NostrService],
})
export class NostrModule {}
