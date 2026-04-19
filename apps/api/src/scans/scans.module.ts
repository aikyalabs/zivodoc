import { Module } from '@nestjs/common';

import { QueueModule } from '@src/queue/queue.module';
import { ScansController } from '@src/scans/scans.controller';
import { ScansService } from '@src/scans/scans.service';
import { ScanProcessor } from '@src/scans/scan.processor';

@Module({
  imports: [QueueModule],
  controllers: [ScansController],
  providers: [ScansService, ScanProcessor],
  exports: [ScansService],
})
export class ScansModule {}
