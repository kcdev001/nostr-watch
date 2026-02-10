import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
} from 'typeorm';
import { NostrEvent } from './nostr-event.entity';

@Entity('keywords')
export class Keyword {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  keyword: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'group_name' })
  groupName: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToMany(() => NostrEvent, (event) => event.keywords)
  @JoinTable({
    name: 'event_keywords',
    joinColumn: { name: 'keyword_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'event_id', referencedColumnName: 'id' },
  })
  events: NostrEvent[];
}
