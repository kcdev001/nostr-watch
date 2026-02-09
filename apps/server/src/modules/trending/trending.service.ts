import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NostrEvent, NostrProfile } from '../../entities';
import { sanitizeEvent } from '../../utils/sanitize';

@Injectable()
export class TrendingService {
  constructor(
    @InjectRepository(NostrEvent)
    private readonly eventRepo: Repository<NostrEvent>,
    @InjectRepository(NostrProfile)
    private readonly profileRepo: Repository<NostrProfile>,
  ) {}

  /**
   * Get trending events by engagement score.
   * Score = reactionCount + repostCount * 2 + replyCount
   */
  async getTrending(period: 'day' | 'week' = 'day', limit = 20) {
    const since = this.getSinceTimestamp(period);

    const events = await this.eventRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.keywords', 'keyword')
      .where('event.createdAt >= :since', { since })
      .andWhere('event.kind = :kind', { kind: 1 })
      .orderBy('event.engagementScore', 'DESC')
      .take(limit)
      .getMany();

    return this.attachProfiles(events);
  }

  /**
   * Get trending events for a specific keyword.
   */
  async getTrendingByKeyword(
    keyword: string,
    period: 'day' | 'week' = 'day',
    limit = 20,
  ) {
    const since = this.getSinceTimestamp(period);

    const events = await this.eventRepo
      .createQueryBuilder('event')
      .innerJoinAndSelect('event.keywords', 'keyword')
      .where('keyword.keyword = :keyword', { keyword })
      .andWhere('event.createdAt >= :since', { since })
      .andWhere('event.kind = :kind', { kind: 1 })
      .orderBy('event.engagementScore', 'DESC')
      .take(limit)
      .getMany();

    return this.attachProfiles(events);
  }

  /**
   * Get most active authors by event count in a period.
   */
  async getTopAuthors(period: 'day' | 'week' = 'week', limit = 20) {
    const since = this.getSinceTimestamp(period);

    const result = await this.eventRepo
      .createQueryBuilder('event')
      .select('event.pubkey', 'pubkey')
      .addSelect('COUNT(*)', 'eventCount')
      .addSelect('SUM(event.reaction_count)', 'totalReactions')
      .where('event.createdAt >= :since', { since })
      .groupBy('event.pubkey')
      .orderBy('eventCount', 'DESC')
      .limit(limit)
      .getRawMany();

    const pubkeys = result.map((r: any) => r.pubkey);
    const profiles =
      pubkeys.length > 0
        ? await this.profileRepo.findBy(pubkeys.map((pk) => ({ pubkey: pk })))
        : [];
    const profileMap = new Map(profiles.map((p) => [p.pubkey, p]));

    return result.map((r: any) => ({
      pubkey: r.pubkey,
      eventCount: parseInt(r.eventCount, 10),
      totalReactions: parseInt(r.totalReactions, 10) || 0,
      profile: profileMap.get(r.pubkey) || null,
    }));
  }

  private getSinceTimestamp(period: 'day' | 'week'): number {
    const now = Math.floor(Date.now() / 1000);
    return period === 'day' ? now - 86400 : now - 604800;
  }

  private async attachProfiles(events: NostrEvent[]) {
    const pubkeys = [...new Set(events.map((e) => e.pubkey))];
    const profiles =
      pubkeys.length > 0
        ? await this.profileRepo.findBy(pubkeys.map((pk) => ({ pubkey: pk })))
        : [];
    const profileMap = new Map(profiles.map((p) => [p.pubkey, p]));

    return events.map((event) => ({
      ...sanitizeEvent(event),
      author: profileMap.get(event.pubkey) || null,
    }));
  }
}
