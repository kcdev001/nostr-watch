import { Controller, Get, Post } from '@nestjs/common';
import { NostrService } from './nostr.service';

@Controller('nostr')
export class NostrController {
  constructor(private readonly nostrService: NostrService) {}

  @Get('status')
  getStatus() {
    return this.nostrService.getStatus();
  }

  @Post('restart')
  async restart() {
    this.nostrService.stopCrawling();
    await this.nostrService.startCrawling();
    return { message: 'Crawling restarted' };
  }
}
