import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('api_keys')
@Index(['userId'])
@Index(['hashedKey'], { unique: true })
export class ApiKeyEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('key');
  }

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
  hashedKey!: string;

  @Column({ type: 'varchar', length: 8, nullable: false })
  prefix!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'varchar', length: 50, nullable: true })
  organizationId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'boolean', nullable: false, default: true })
  isActive!: boolean;
}
