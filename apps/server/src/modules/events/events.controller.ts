import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { EventsService } from './events.service';

const MAX_LIMIT = 100;

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  findRecent(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.eventsService.findRecent(page, Math.min(limit, MAX_LIMIT));
  }

  @Get('stats')
  getStats() {
    return this.eventsService.getStats();
  }

  @Get('search')
  search(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }
    return this.eventsService.search(query.trim(), page, Math.min(limit, MAX_LIMIT));
  }

  @Get('keyword/:keyword')
  findByKeyword(
    @Param('keyword') keyword: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.eventsService.findByKeyword(keyword, page, Math.min(limit, MAX_LIMIT));
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }
}
