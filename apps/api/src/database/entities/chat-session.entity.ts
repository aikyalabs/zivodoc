import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';

@Entity('chat_sessions')
@Index(['projectId'])
@Index(['ipHash'])
export class ChatSessionEntity extends BaseEntity {
  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = BaseEntity.generateId('chat');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @Column({ type: 'varchar', length: 64, nullable: false })
  ipHash!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  origin!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pageUrl!: string | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  messageCount!: number;
}
