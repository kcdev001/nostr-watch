import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('nostr_profiles')
export class NostrProfile {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  pubkey: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'display_name' })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  picture: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nip05: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
