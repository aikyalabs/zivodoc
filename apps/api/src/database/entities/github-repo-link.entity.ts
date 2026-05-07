import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('github_repo_links')
@Index(['projectId'], { unique: true })
@Index(['repoId', 'organizationId'], { unique: true })
@Index(['installationId'])
export class GitHubRepoLinkEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('ghrl');
  }

  @Column({ type: 'int', nullable: false })
  installationId!: number;

  @Column({ type: 'int', nullable: false })
  repoId!: number;

  @Column({ type: 'varchar', length: 200, nullable: false })
  repoFullName!: string;

  @Column({ type: 'varchar', length: 100, nullable: false, default: 'main' })
  repoDefaultBranch!: string;

  @Column({ type: 'boolean', nullable: false, default: false })
  repoPrivate!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'boolean', nullable: false, default: true })
  webhookEnabled!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  checkRunsEnabled!: boolean;

  @Column({ type: 'boolean', nullable: false, default: true })
  prCommentsEnabled!: boolean;
}
