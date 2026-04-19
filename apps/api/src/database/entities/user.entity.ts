import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  DeleteDateColumn,
} from 'typeorm';

import { UserRole } from '@zivodoc/shared';

import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { RoleEntity } from './role.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['googleId'], { unique: true, where: '"googleId" IS NOT NULL' })
@Index(['organizationId'])
@Index(['roleId'])
export class UserEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    if (!this.id) this.id = BaseEntity.generateId('user');
  }

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: false })
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  googleId!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar!: string | null;

  @Column({ type: 'boolean', nullable: false, default: false })
  onboardingCompleted!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'member' })
  role!: UserRole;

  @Column({ type: 'boolean', nullable: false, default: false })
  isDisabled!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  organizationId!: string | null;

  @ManyToOne(() => OrganizationEntity, (org) => org.users, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roleId!: string | null;

  @ManyToOne(() => RoleEntity, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'roleId' })
  assignedRole!: RoleEntity | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
