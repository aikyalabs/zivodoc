import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Index,
} from 'typeorm';
import { randomBytes } from 'crypto';

import { UserEntity } from './user.entity';

@Entity('sessions')
@Index(['userId'])
@Index(['expiresAt'])
export class SessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  token!: string;

  @BeforeInsert()
  generateToken() {
    if (!this.token) this.token = randomBytes(48).toString('hex');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  userId!: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;
}
