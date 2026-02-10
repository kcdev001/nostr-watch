import { Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from '../../entities';
import { NostrService } from '../nostr/nostr.service';

const DEFAULT_KEYWORDS: Array<{ keyword: string; groupName: string | null }> = [
  { keyword: 'BTC', groupName: 'Bitcoin' },
  { keyword: 'Bitcoin', groupName: 'Bitcoin' },
  { keyword: 'Keychat', groupName: null },
  { keyword: 'Signal', groupName: null },
  { keyword: 'Damus', groupName: null },
];

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
    for (const item of DEFAULT_KEYWORDS) {
      const exists = await this.keywordRepo.findOne({
        where: { keyword: item.keyword },
      });
      if (!exists) {
        await this.keywordRepo.save(
          this.keywordRepo.create({
            keyword: item.keyword,
            groupName: item.groupName,
            isActive: true,
          }),
        );
      } else if (exists.groupName !== item.groupName) {
        // Backfill groupName for existing records
        exists.groupName = item.groupName;
        await this.keywordRepo.save(exists);
      }
    }
  }

  async findAll(): Promise<Keyword[]> {
    return this.keywordRepo.find({ order: { createdAt: 'ASC' } });
  }

  async findActive(): Promise<Keyword[]> {
    return this.keywordRepo.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findActiveGroups(): Promise<Array<{ name: string; keywords: string[] }>> {
    const active = await this.findActive();
    const groupMap = new Map<string, string[]>();

    for (const kw of active) {
      const groupName = kw.groupName || kw.keyword;
      const existing = groupMap.get(groupName) || [];
      existing.push(kw.keyword);
      groupMap.set(groupName, existing);
    }

    return Array.from(groupMap.entries()).map(([name, keywords]) => ({
      name,
      keywords,
    }));
  }

  async findKeywordsByGroup(groupName: string): Promise<string[]> {
    const active = await this.findActive();
    return active
      .filter((kw) => (kw.groupName || kw.keyword) === groupName)
      .map((kw) => kw.keyword);
  }

  async create(keyword: string, groupName?: string): Promise<Keyword> {
    const entity = this.keywordRepo.create({
      keyword,
      groupName: groupName || null,
      isActive: true,
    });
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
