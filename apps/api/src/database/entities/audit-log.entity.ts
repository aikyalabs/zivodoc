import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['actorId'])
@Index(['action'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  organizationId!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: false })
  method!: string;

  @Column({ type: 'varchar', length: 500, nullable: false })
  path!: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  action!: string;

  @Column({ type: 'int', nullable: false })
  statusCode!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({ type: 'int', nullable: false })
  duration!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
