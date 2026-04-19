import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { ScanMode } from '@zivodoc/shared';

import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('projects')
@Index(['organizationId'])
@Index(['repoUrl', 'organizationId'], { unique: true, where: '"repoUrl" IS NOT NULL' })
@Index(['siteUrl', 'organizationId'], { unique: true, where: '"siteUrl" IS NOT NULL' })
export class ProjectEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('proj');
  }

  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  siteUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  repoUrl!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: false, default: 'main' })
  defaultBranch!: string;

  @Column({ type: 'jsonb', nullable: false, default: '["docs/","README.md"]' })
  docPaths!: string[];

  @Column({ type: 'varchar', length: 10, nullable: false, default: 'site' })
  scanMode!: ScanMode;

  @Column({ type: 'int', nullable: false, default: 500 })
  maxPages!: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;
}
