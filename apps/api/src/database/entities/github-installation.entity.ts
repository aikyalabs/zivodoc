import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('github_installations')
@Index(['installationId'], { unique: true })
@Index(['organizationId'])
export class GitHubInstallationEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('ghi');
  }

  @Column({ type: 'int', nullable: false, unique: true })
  installationId!: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  accountLogin!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  accountType!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  accountAvatarUrl!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'varchar', length: 50, nullable: false })
  installedById!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'installedById' })
  installedBy!: UserEntity;

  @Column({ type: 'jsonb', nullable: true })
  permissions!: unknown;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'selected' })
  repositorySelection!: string;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt!: Date | null;
}
