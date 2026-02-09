import { Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from '../../entities';
import { NostrService } from '../nostr/nostr.service';

const DEFAULT_KEYWORDS = ['BTC', 'Bitcoin', 'Keychat', 'Signal', 'Damus'];

@Injectable()
export class KeywordsService implements OnModuleInit {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @Inject(forwardRef(() => NostrService))
    private readonly nostrService: NostrService,
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  private async seedDefaults() {
    for (const word of DEFAULT_KEYWORDS) {
      const exists = await this.keywordRepo.findOne({
        where: { keyword: word },
      });
      if (!exists) {
        await this.keywordRepo.save(
          this.keywordRepo.create({ keyword: word, isActive: true }),
        );
      }
    }
  }

  async findAll(): Promise<Keyword[]> {
    return this.keywordRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findActive(): Promise<Keyword[]> {
    return this.keywordRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(keyword: string): Promise<Keyword> {
    const entity = this.keywordRepo.create({ keyword, isActive: true });
    const saved = await this.keywordRepo.save(entity);
    await this.nostrService.reloadKeywords();
    return saved;
  }

  async toggle(id: number): Promise<Keyword> {
    const keyword = await this.keywordRepo.findOneByOrFail({ id });
    keyword.isActive = !keyword.isActive;
    const saved = await this.keywordRepo.save(keyword);
    await this.nostrService.reloadKeywords();
    return saved;
  }

  async remove(id: number): Promise<void> {
    await this.keywordRepo.delete(id);
    await this.nostrService.reloadKeywords();
  }
}
