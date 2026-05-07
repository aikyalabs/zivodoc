import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

export type AiProvider = 'anthropic' | 'openai';

@Entity('ai_provider_keys')
@Index(['organizationId', 'provider'], { unique: true })
export class AiProviderKeyEntity extends BaseEntity {
  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = BaseEntity.generateId('aikey');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'varchar', length: 20, nullable: false })
  provider!: AiProvider;

  @Column({ type: 'varchar', length: 50, nullable: false })
  model!: string;

  @Column({ type: 'text', nullable: false })
  encryptedKey!: string;

  @Column({ type: 'varchar', length: 12, nullable: false })
  keyPreview!: string;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  createdByUserId!: string | null;
}
