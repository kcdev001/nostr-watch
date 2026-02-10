import { Controller, Get, Post, Param } from '@nestjs/common';
import { NostrService } from './nostr.service';

@Controller('nostr')
export class NostrController {
  constructor(private readonly nostrService: NostrService) {}

  @Get('status')
  getStatus() {
    return this.nostrService.getStatus();
  }

  @Get('replies/:eventId')
  getReplies(@Param('eventId') eventId: string) {
    return this.nostrService.fetchReplies(eventId);
  }

  @Post('restart')
  async restart() {
    this.nostrService.stopCrawling();
    await this.nostrService.startCrawling();
    return { message: 'Crawling restarted' };
  }
}
