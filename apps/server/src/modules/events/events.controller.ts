import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { KeywordsService } from '../keywords/keywords.service';

const MAX_LIMIT = 100;

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly keywordsService: KeywordsService,
  ) {}

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

  @Get('group/:group')
  async findByGroup(
    @Param('group') group: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const keywords = await this.keywordsService.findKeywordsByGroup(group);
    if (keywords.length === 0) {
      throw new NotFoundException(`No keywords found for group "${group}"`);
    }
    return this.eventsService.findByKeywords(keywords, page, Math.min(limit, MAX_LIMIT));
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }
}
