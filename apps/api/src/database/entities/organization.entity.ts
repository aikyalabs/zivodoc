import { Entity, Column, OneToMany, Index, BeforeInsert } from 'typeorm';

import { PlanType } from '@zivodoc/shared';

import { BaseEntity } from './base.entity';
import type { UserEntity } from './user.entity';
import type { RoleEntity } from './role.entity';

@Entity('organizations')
@Index(['slug'], { unique: true })
export class OrganizationEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('org');
  }

  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: false })
  slug!: string;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'free' })
  plan!: PlanType;

  @Column({ type: 'int', nullable: false, default: 3 })
  scanQuota!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  scansUsedThisMonth!: number;

  @Column({ type: 'int', nullable: false, default: 500 })
  maxPages!: number;

  @Column({ type: 'int', nullable: false, default: 1 })
  maxProjects!: number;

  @OneToMany('UserEntity', 'organization', { cascade: false })
  users!: UserEntity[];

  @OneToMany('RoleEntity', 'organization', { cascade: false })
  roles!: RoleEntity[];
}
