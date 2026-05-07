import { Entity, Column, ManyToOne, JoinColumn, Index, BeforeInsert } from 'typeorm';

import { BaseEntity } from './base.entity';
import { ChatSessionEntity } from './chat-session.entity';

export type ChatMessageRole = 'user' | 'assistant';

export interface Citation {
  source: string;
  anchor: string | null;
  headingPath: string | null;
}

@Entity('chat_messages')
@Index(['sessionId'])
@Index(['projectId'])
export class ChatMessageEntity extends BaseEntity {
  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = BaseEntity.generateId('msg');
  }

  @Column({ type: 'varchar', length: 50, nullable: false })
  sessionId!: string;

  @ManyToOne(() => ChatSessionEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'sessionId' })
  session!: ChatSessionEntity;

  @Column({ type: 'varchar', length: 50, nullable: false })
  projectId!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  role!: ChatMessageRole;

  @Column({ type: 'text', nullable: false })
  content!: string;

  @Column({ type: 'jsonb', nullable: true })
  citations!: Citation[] | null;

  @Column({ type: 'jsonb', nullable: true })
  retrievedChunkIds!: string[] | null;

  @Column({ type: 'int', nullable: false, default: 0 })
  promptTokens!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  completionTokens!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  latencyMs!: number;

  @Column({ type: 'boolean', nullable: false, default: false })
  lowConfidence!: boolean;
}
