import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('roles')
@Index(['name', 'organizationId'], { unique: true })
@Index(['organizationId'])
export class RoleEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('role');
  }

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', default: [] })
  permissions!: Array<{ resource: string; actions: string[] }>;

  @Column({ type: 'varchar', length: 50, nullable: false })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, (org) => org.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;
}
