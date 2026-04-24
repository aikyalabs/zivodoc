import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { FindingCategory, FindingSeverity, FindingStatus } from '@zivodoc/shared';

import { BaseEntity } from './base.entity';
import { ScanEntity } from './scan.entity';
import { ProjectEntity } from './project.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('findings')
@Index(['scanId'])
@Index(['projectId'])
@Index(['organizationId'])
@Index(['category'])
@Index(['severity'])
@Index(['status'])
@Index(['fingerprint', 'projectId'])
export class FindingEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('fnd');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  scanId!: string;

  @ManyToOne(() => ScanEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'scanId' })
  scan!: ScanEntity;

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

  @Column({ type: 'varchar', length: 30, nullable: false })
  category!: FindingCategory;

  @Column({ type: 'varchar', length: 10, nullable: false })
  severity!: FindingSeverity;

  @Column({ type: 'varchar', length: 500, nullable: false })
  source!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  line!: number;

  @Column({ type: 'varchar', length: 300, nullable: false })
  title!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @Column({ type: 'text', nullable: true })
  suggestion!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'open' })
  status!: FindingStatus;

  @Column({ type: 'jsonb', nullable: true })
  rawData!: Record<string, unknown> | null;

  /** Deterministic key for matching findings across scans: category|source|title_hash */
  @Column({ type: 'varchar', length: 100, nullable: false, default: '' })
  fingerprint!: string;

  /** The scan where this finding was first detected */
  @Column({ type: 'varchar', length: 50, nullable: false, default: '' })
  firstSeenScanId!: string;

  /** The most recent scan where this finding was detected */
  @Column({ type: 'varchar', length: 50, nullable: false, default: '' })
  lastSeenScanId!: string;

  /** How many consecutive scans this finding has appeared in */
  @Column({ type: 'int', nullable: false, default: 1 })
  seenCount!: number;
}
