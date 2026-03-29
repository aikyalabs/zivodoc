import { Entity, Column, OneToMany, Index, BeforeInsert } from 'typeorm';

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

  @OneToMany('UserEntity', 'organization', { cascade: false })
  users!: UserEntity[];

  @OneToMany('RoleEntity', 'organization', { cascade: false })
  roles!: RoleEntity[];
}
