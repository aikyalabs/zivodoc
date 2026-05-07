import { Module } from '@nestjs/common';

import { QueueModule } from '@src/queue/queue.module';
import { GitHubModule } from '@src/github/github.module';
import { ChatModule } from '@src/chat/chat.module';
import { ScansController } from '@src/scans/scans.controller';
import { ScansService } from '@src/scans/scans.service';
import { ScanProcessor } from '@src/scans/scan.processor';
import { ScanSchedulerService } from '@src/scans/scan-scheduler.service';

@Module({
  imports: [QueueModule, GitHubModule, ChatModule],
  controllers: [ScansController],
  providers: [ScansService, ScanProcessor, ScanSchedulerService],
  exports: [ScansService],
})
export class ScansModule {}
