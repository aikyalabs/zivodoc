import { CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ulid } from 'ulid';

export abstract class BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  static generateId(prefix: string): string {
    return `${prefix}_${ulid()}`;
  }
}
