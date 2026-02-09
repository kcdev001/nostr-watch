import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TrendingService } from './trending.service';

const MAX_LIMIT = 100;

@Controller('trending')
export class TrendingController {
  constructor(private readonly trendingService: TrendingService) {}

  @Get()
  getTrending(
    @Query('period', new DefaultValuePipe('day')) period: 'day' | 'week',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.trendingService.getTrending(period, Math.min(limit, MAX_LIMIT));
  }

  @Get('keyword/:keyword')
  getTrendingByKeyword(
    @Param('keyword') keyword: string,
    @Query('period', new DefaultValuePipe('day')) period: 'day' | 'week',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.trendingService.getTrendingByKeyword(keyword, period, Math.min(limit, MAX_LIMIT));
  }

  @Get('authors')
  getTopAuthors(
    @Query('period', new DefaultValuePipe('week')) period: 'day' | 'week',
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.trendingService.getTopAuthors(period, Math.min(limit, MAX_LIMIT));
  }
}
