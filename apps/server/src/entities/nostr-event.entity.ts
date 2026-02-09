import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  ManyToMany,
  CreateDateColumn,
} from 'typeorm';
import { Keyword } from './keyword.entity';

@Entity('nostr_events')
export class NostrEvent {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  pubkey: string;

  @Index()
  @Column({ type: 'int' })
  kind: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json' })
  tags: string[][];

  @Index()
  @Column({ type: 'int', name: 'created_at' })
  createdAt: number;

  @Column({ type: 'varchar', length: 255, name: 'relay_url', nullable: true })
  relayUrl: string;

  @Column({ type: 'int', name: 'reaction_count', default: 0 })
  reactionCount: number;

  @Column({ type: 'int', name: 'repost_count', default: 0 })
  repostCount: number;

  @Column({ type: 'int', name: 'reply_count', default: 0 })
  replyCount: number;

  @Index()
  @Column({ type: 'int', name: 'engagement_score', default: 0 })
  engagementScore: number;

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date;

  @ManyToMany(() => Keyword, (keyword) => keyword.events)
  keywords: Keyword[];
}
