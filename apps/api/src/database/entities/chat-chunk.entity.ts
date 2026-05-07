import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ProjectEntity } from './project.entity';

/**
 * The `embedding` column lives in the actual table as `vector(N)` (pgvector type) and is managed
 * exclusively via raw SQL in ChatChunkRepository. It is intentionally absent from this entity to
 * prevent TypeORM from misinterpreting the column as a string. The table is created by
 * ChatBootstrapService at app start, not by TypeORM synchronize.
 */
@Entity({ name: 'chat_chunks', synchronize: false })
@Index(['projectId'])
export class ChatChunkEntity extends BaseEntity {
  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = BaseEntity.generateId('chunk');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  projectId!: string;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @Column({ type: 'varchar', length: 500, nullable: false })
  source!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  anchor!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  headingPath!: string | null;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  tokenCount!: number;

  @Column({ type: 'varchar', length: 50, nullable: false })
  scanId!: string;
}
