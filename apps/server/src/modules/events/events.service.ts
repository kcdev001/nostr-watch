import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NostrEvent, NostrProfile } from '../../entities';
import { sanitizeEvent } from '../../utils/sanitize';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(NostrEvent)
    private readonly eventRepo: Repository<NostrEvent>,
    @InjectRepository(NostrProfile)
    private readonly profileRepo: Repository<NostrProfile>,
  ) {}

  async findByKeyword(
    keyword: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .innerJoin('event.keywords', 'keyword')
      .where('keyword.keyword = :keyword', { keyword })
      .orderBy('event.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    const pubkeys = [...new Set(items.map((e) => e.pubkey))];
    const profiles =
      pubkeys.length > 0
        ? await this.profileRepo.findBy(
            pubkeys.map((pk) => ({ pubkey: pk })),
          )
        : [];

    const profileMap = new Map(profiles.map((p) => [p.pubkey, p]));

    return {
      items: items.map((event) => ({
        ...sanitizeEvent(event),
        author: profileMap.get(event.pubkey) || null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findRecent(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total] = await this.eventRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
      relations: ['keywords'],
    });

    const pubkeys = [...new Set(items.map((e) => e.pubkey))];
    const profiles =
      pubkeys.length > 0
        ? await this.profileRepo.findBy(
            pubkeys.map((pk) => ({ pubkey: pk })),
          )
        : [];

    const profileMap = new Map(profiles.map((p) => [p.pubkey, p]));

    return {
      items: items.map((event) => ({
        ...sanitizeEvent(event),
        author: profileMap.get(event.pubkey) || null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['keywords'],
    });

    if (!event) return null;

    const profile = await this.profileRepo.findOne({
      where: { pubkey: event.pubkey },
    });

    return { ...sanitizeEvent(event), author: profile || null };
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.keywords', 'keyword')
      .where('event.content LIKE :query', { query: `%${query}%` })
      .orderBy('event.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    const pubkeys = [...new Set(items.map((e) => e.pubkey))];
    const profiles =
      pubkeys.length > 0
        ? await this.profileRepo.findBy(
            pubkeys.map((pk) => ({ pubkey: pk })),
          )
        : [];

    const profileMap = new Map(profiles.map((p) => [p.pubkey, p]));

    return {
      items: items.map((event) => ({
        ...sanitizeEvent(event),
        author: profileMap.get(event.pubkey) || null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const totalEvents = await this.eventRepo.count();
    const totalProfiles = await this.profileRepo.count();
    const todayStart = Math.floor(
      new Date().setHours(0, 0, 0, 0) / 1000,
    );
    const todayEvents = await this.eventRepo
      .createQueryBuilder('event')
      .where('event.createdAt >= :since', { since: todayStart })
      .getCount();

    return { totalEvents, totalProfiles, todayEvents };
  }
}
