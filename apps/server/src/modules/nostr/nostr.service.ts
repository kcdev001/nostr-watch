import { Injectable, Inject, forwardRef, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NostrEvent, NostrProfile, Keyword } from '../../entities';
import { KeywordsService } from '../keywords/keywords.service';

let nostrTools: typeof import('nostr-tools');

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.snort.social',
  'wss://offchain.pub',
];

// Rate limiting & batch config
const WRITE_QUEUE_FLUSH_INTERVAL = 2000;
const WRITE_QUEUE_MAX_SIZE = 50;
const RELAY_QUERY_DELAY = 1000;
const PROFILE_BATCH_SIZE = 10;
const ENGAGEMENT_BATCH_SIZE = 15;

@Injectable()
export class NostrService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NostrService.name);
  private pool: any;
  private activeSubscriptions: any[] = [];
  private isRunning = false;

  // Config
  private relays: string[];
  private queryTimeout: number;

  // Write queue
  private writeQueue: Array<{ event: any; matchedKeywords: string[] }> = [];
  private writeTimer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  // Keyword cache - avoid DB query on every flush
  private cachedKeywords: Keyword[] = [];
  private keywordCacheTime = 0;
  private readonly KEYWORD_CACHE_TTL = 30000; // 30s

  // Dedup in-memory cache
  private seenEventIds = new Set<string>();
  private readonly MAX_SEEN_CACHE = 10000;

  // Lock flags
  private isFetchingProfiles = false;
  private isFetchingEngagement = false;

  constructor(
    @InjectRepository(NostrEvent)
    private readonly eventRepo: Repository<NostrEvent>,
    @InjectRepository(NostrProfile)
    private readonly profileRepo: Repository<NostrProfile>,
    @Inject(forwardRef(() => KeywordsService))
    private readonly keywordsService: KeywordsService,
    private readonly configService: ConfigService,
  ) {
    const relayStr = this.configService.get<string>('NOSTR_RELAYS', '');
    this.relays = relayStr
      ? relayStr.split(',').map((r) => r.trim()).filter(Boolean)
      : DEFAULT_RELAYS;
    this.queryTimeout = this.configService.get<number>('RELAY_QUERY_TIMEOUT', 8000);
  }

  async onModuleInit() {
    await this.initNostrTools();
    this.startWriteQueue();
    await this.startCrawling();
  }

  onModuleDestroy() {
    this.stopCrawling();
    this.stopWriteQueue();
  }

  // ─── nostr-tools init ───────────────────────────────────

  private async initNostrTools() {
    try {
      const WebSocket = (await import('ws')).default;
      nostrTools = await import('nostr-tools');

      if (typeof globalThis.WebSocket === 'undefined') {
        (globalThis as any).WebSocket = WebSocket;
      }

      this.pool = new nostrTools.SimplePool();
      this.logger.log('nostr-tools initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize nostr-tools', error);
    }
  }

  // ─── Keyword cache ──────────────────────────────────────

  private async getActiveKeywords(): Promise<Keyword[]> {
    const now = Date.now();
    if (now - this.keywordCacheTime < this.KEYWORD_CACHE_TTL && this.cachedKeywords.length > 0) {
      return this.cachedKeywords;
    }
    this.cachedKeywords = await this.keywordsService.findActive();
    this.keywordCacheTime = now;
    return this.cachedKeywords;
  }

  /** Called by KeywordsService when keywords change. */
  invalidateKeywordCache() {
    this.keywordCacheTime = 0;
  }

  /** Restart crawling with updated keywords. */
  async reloadKeywords() {
    this.invalidateKeywordCache();
    this.logger.log('Keywords changed, restarting crawler');
    this.stopCrawling();
    await this.startCrawling();
  }

  // ─── Write queue ────────────────────────────────────────

  private startWriteQueue() {
    this.writeTimer = setInterval(() => {
      this.flushWriteQueue();
    }, WRITE_QUEUE_FLUSH_INTERVAL);
  }

  private stopWriteQueue() {
    if (this.writeTimer) {
      clearInterval(this.writeTimer);
      this.writeTimer = null;
    }
    this.flushWriteQueue();
  }

  private async flushWriteQueue() {
    if (this.isFlushing || this.writeQueue.length === 0) return;
    this.isFlushing = true;

    const batch = this.writeQueue.splice(0, WRITE_QUEUE_MAX_SIZE);

    try {
      const allKeywords = await this.getActiveKeywords();

      for (const item of batch) {
        try {
          const nostrEvent = this.eventRepo.create({
            id: item.event.id,
            pubkey: item.event.pubkey,
            kind: item.event.kind,
            content: item.event.content,
            tags: item.event.tags,
            createdAt: item.event.created_at,
          });

          const matched = allKeywords.filter((k) =>
            item.matchedKeywords.includes(k.keyword),
          );
          if (matched.length > 0) {
            nostrEvent.keywords = matched;
          }

          await this.eventRepo.save(nostrEvent);
        } catch (error: any) {
          if (error?.code !== 'ER_DUP_ENTRY') {
            this.logger.error(`Failed to save event ${item.event.id}`, error);
          }
        }
      }

      if (batch.length > 0) {
        this.logger.debug(`Flushed ${batch.length} events to DB`);
      }
    } catch (error) {
      this.logger.error('Write queue flush error', error);
    } finally {
      this.isFlushing = false;
    }
  }

  // ─── Crawling ───────────────────────────────────────────

  async startCrawling() {
    if (this.isRunning || !this.pool) return;
    this.isRunning = true;

    // Warm up dedup cache from recent DB events
    await this.warmUpSeenCache();

    const keywords = await this.getActiveKeywords();
    if (keywords.length === 0) {
      this.logger.warn('No active keywords to crawl');
      return;
    }

    this.logger.log(
      `Starting crawl for keywords: ${keywords.map((k) => k.keyword).join(', ')}`,
    );
    this.logger.log(`Connecting to relays: ${this.relays.join(', ')}`);

    this.subscribeToTextNotes(keywords.map((k) => k.keyword));
  }

  private async warmUpSeenCache() {
    try {
      const recentEvents = await this.eventRepo.find({
        select: ['id'],
        order: { createdAt: 'DESC' },
        take: this.MAX_SEEN_CACHE,
      });

      for (const e of recentEvents) {
        this.seenEventIds.add(e.id);
      }

      this.logger.log(`Warmed up dedup cache with ${recentEvents.length} event IDs`);
    } catch (error) {
      this.logger.warn('Failed to warm up seen cache', error);
    }
  }

  private subscribeToTextNotes(keywords: string[]) {
    try {
      const since = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

      const sub = this.pool.subscribeMany(
        this.relays,
        { kinds: [1], since, limit: 500 },
        {
          onevent: (event: any) => {
            this.enqueueEvent(event, keywords);
          },
          oneose: () => {
            this.logger.log('Initial batch received, now listening for real-time events');
          },
          onclose: (reasons: string[]) => {
            this.logger.warn(`Subscription closed: ${reasons}`);
          },
        },
      );

      this.activeSubscriptions.push(sub);
    } catch (error) {
      this.logger.error('Failed to subscribe to text notes', error);
    }
  }

  private enqueueEvent(event: any, keywords: string[]) {
    if (this.seenEventIds.has(event.id)) return;

    const content = event.content?.toLowerCase() || '';
    const matchedKeywords = keywords.filter((kw) =>
      content.includes(kw.toLowerCase()),
    );
    if (matchedKeywords.length === 0) return;

    this.seenEventIds.add(event.id);
    if (this.seenEventIds.size > this.MAX_SEEN_CACHE) {
      const first = this.seenEventIds.values().next().value!;
      this.seenEventIds.delete(first);
    }

    this.writeQueue.push({ event, matchedKeywords });

    if (this.writeQueue.length >= WRITE_QUEUE_MAX_SIZE) {
      this.flushWriteQueue();
    }
  }

  // ─── Relay query with timeout ───────────────────────────

  private async querySyncWithTimeout(filter: any): Promise<any[]> {
    return Promise.race([
      this.pool.querySync(this.relays, filter),
      new Promise<any[]>((_, reject) =>
        setTimeout(() => reject(new Error('Relay query timeout')), this.queryTimeout),
      ),
    ]);
  }

  // ─── Profile fetching ──────────────────────────────────

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchMissingProfiles() {
    if (!this.pool || this.isFetchingProfiles) return;
    this.isFetchingProfiles = true;

    try {
      const result = await this.eventRepo
        .createQueryBuilder('event')
        .select('DISTINCT event.pubkey', 'pubkey')
        .leftJoin(NostrProfile, 'profile', 'event.pubkey = profile.pubkey')
        .where('profile.pubkey IS NULL')
        .limit(50)
        .getRawMany();

      const pubkeys = result.map((r: any) => r.pubkey);
      if (pubkeys.length === 0) return;

      this.logger.log(`Fetching ${pubkeys.length} missing profiles`);

      for (let i = 0; i < pubkeys.length; i += PROFILE_BATCH_SIZE) {
        const batch = pubkeys.slice(i, i + PROFILE_BATCH_SIZE);

        try {
          const events = await this.querySyncWithTimeout({
            kinds: [0],
            authors: batch,
          });

          for (const event of events) {
            try {
              const metadata = JSON.parse(event.content);
              await this.profileRepo.save(
                this.profileRepo.create({
                  pubkey: event.pubkey,
                  name: metadata.name || null,
                  displayName: metadata.display_name || null,
                  about: metadata.about || null,
                  picture: metadata.picture || null,
                  nip05: metadata.nip05 || null,
                }),
              );
            } catch {
              // Skip invalid profile
            }
          }
        } catch (error) {
          this.logger.warn(`Profile batch ${i} failed: ${error}`);
        }

        if (i + PROFILE_BATCH_SIZE < pubkeys.length) {
          await this.delay(RELAY_QUERY_DELAY);
        }
      }
    } catch (error) {
      this.logger.error('Failed to fetch profiles', error);
    } finally {
      this.isFetchingProfiles = false;
    }
  }

  // ─── Engagement counts ─────────────────────────────────

  @Cron(CronExpression.EVERY_10_MINUTES)
  async fetchEngagementCounts() {
    if (!this.pool || this.isFetchingEngagement) return;
    this.isFetchingEngagement = true;

    try {
      const recentEvents = await this.eventRepo.find({
        where: { kind: 1 },
        order: { createdAt: 'DESC' },
        take: 100,
        select: ['id'],
      });

      if (recentEvents.length === 0) return;

      const allIds = recentEvents.map((e) => e.id);
      this.logger.log(
        `Fetching engagement for ${allIds.length} events in batches of ${ENGAGEMENT_BATCH_SIZE}`,
      );

      const reactionCounts = new Map<string, number>();
      const repostCounts = new Map<string, number>();
      const replyCounts = new Map<string, number>();

      for (let i = 0; i < allIds.length; i += ENGAGEMENT_BATCH_SIZE) {
        const batchIds = allIds.slice(i, i + ENGAGEMENT_BATCH_SIZE);

        try {
          const reactions = await this.querySyncWithTimeout({
            kinds: [7],
            '#e': batchIds,
          });
          await this.delay(RELAY_QUERY_DELAY);

          const reposts = await this.querySyncWithTimeout({
            kinds: [6],
            '#e': batchIds,
          });
          await this.delay(RELAY_QUERY_DELAY);

          const replies = await this.querySyncWithTimeout({
            kinds: [1],
            '#e': batchIds,
          });

          for (const r of reactions) {
            const eTag = r.tags?.find((t: string[]) => t[0] === 'e');
            if (eTag) {
              reactionCounts.set(eTag[1], (reactionCounts.get(eTag[1]) || 0) + 1);
            }
          }
          for (const r of reposts) {
            const eTag = r.tags?.find((t: string[]) => t[0] === 'e');
            if (eTag) {
              repostCounts.set(eTag[1], (repostCounts.get(eTag[1]) || 0) + 1);
            }
          }
          for (const r of replies) {
            const eTag = r.tags?.find((t: string[]) => t[0] === 'e');
            if (eTag) {
              replyCounts.set(eTag[1], (replyCounts.get(eTag[1]) || 0) + 1);
            }
          }
        } catch (error) {
          this.logger.warn(`Engagement batch ${i} failed: ${error}`);
        }

        if (i + ENGAGEMENT_BATCH_SIZE < allIds.length) {
          await this.delay(RELAY_QUERY_DELAY * 2);
        }
      }

      let updated = 0;
      for (const eventId of allIds) {
        const rc = reactionCounts.get(eventId) || 0;
        const rp = repostCounts.get(eventId) || 0;
        const rl = replyCounts.get(eventId) || 0;

        if (rc > 0 || rp > 0 || rl > 0) {
          await this.eventRepo.update(eventId, {
            reactionCount: rc,
            repostCount: rp,
            replyCount: rl,
            engagementScore: rc + rp * 2 + rl,
          });
          updated++;
        }
      }

      if (updated > 0) {
        this.logger.log(`Updated engagement counts for ${updated} events`);
      }
    } catch (error) {
      this.logger.error('Failed to fetch engagement counts', error);
    } finally {
      this.isFetchingEngagement = false;
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async restartCrawling() {
    this.logger.log('Restarting crawl subscriptions (hourly refresh)');
    this.stopCrawling();
    await this.startCrawling();
  }

  stopCrawling() {
    for (const sub of this.activeSubscriptions) {
      try {
        sub.close();
      } catch {
        // Ignore close errors
      }
    }
    this.activeSubscriptions = [];
    this.isRunning = false;
    this.logger.log('Crawling stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      relays: this.relays,
      activeSubscriptions: this.activeSubscriptions.length,
      writeQueueSize: this.writeQueue.length,
      seenCacheSize: this.seenEventIds.size,
    };
  }

  // ─── Helpers ────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
