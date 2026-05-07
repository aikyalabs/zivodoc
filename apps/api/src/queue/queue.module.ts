import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '@src/config.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const url = new URL(config.get('REDIS_URL'));
        const db = url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : 0;
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            username: url.username || undefined,
            password: url.password ? decodeURIComponent(url.password) : undefined,
            db: Number.isFinite(db) ? db : 0,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: 'scan' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
