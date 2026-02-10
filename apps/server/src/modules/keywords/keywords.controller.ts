import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { KeywordsService } from './keywords.service';

@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Get()
  findAll() {
    return this.keywordsService.findAll();
  }

  @Get('groups')
  findActiveGroups() {
    return this.keywordsService.findActiveGroups();
  }

  @Post()
  create(
    @Body('keyword') keyword: string,
    @Body('groupName') groupName?: string,
  ) {
    return this.keywordsService.create(keyword, groupName);
  }

  @Patch(':id/toggle')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.toggle(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.keywordsService.remove(id);
  }
}
