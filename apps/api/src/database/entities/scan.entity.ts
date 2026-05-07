import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { ScanMode, ScanStatus } from '@zivodoc/shared';

import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('scans')
@Index(['projectId'])
@Index(['organizationId'])
@Index(['status'])
export class ScanEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('scan');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'varchar', length: 10, nullable: false })
  mode!: ScanMode;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending' })
  status!: ScanStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  branch!: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  commitSha!: string | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  pagesScanned!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  codeBlocksFound!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  linksChecked!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  findingsCount!: number;

  @Column({ type: 'int', nullable: true })
  duration!: number | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'manual' })
  triggerSource!: string;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: null })
  steps!: unknown;

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;
}
