import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Sanity-check that the pgvector extension and chat_chunks table exist. Both are created by the
 * InitialSchema migration; this service only logs a warning if something is wrong (e.g. the
 * migration was skipped or the DB role lacks privileges). Chat features will be unavailable in
 * that case but the API still boots.
 */
@Injectable()
export class ChatBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(ChatBootstrapService.name);

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    try {
      const ext = await this.ds.query<Array<{ extname: string }>>(
        `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
      );
      if (ext.length === 0) {
        this.logger.warn(
          'pgvector extension is not installed. Chat features will be unavailable. Run migrations or have a superuser create the extension.',
        );
        return;
      }

      const tbl = await this.ds.query<Array<{ to_regclass: string | null }>>(
        `SELECT to_regclass('chat_chunks')::text AS to_regclass`,
      );
      if (!tbl[0]?.to_regclass) {
        this.logger.warn(
          'chat_chunks table missing — migrations may not have run. Chat features will be unavailable.',
        );
      }
    } catch (err) {
      this.logger.warn(`Could not verify chat schema: ${err instanceof Error ? err.message : err}`);
    }
  }
}
