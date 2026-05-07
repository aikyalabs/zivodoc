import { Module } from '@nestjs/common';

import { AiKeysController } from './ai-keys.controller';
import { AiKeysService } from './ai-keys.service';

@Module({
  controllers: [AiKeysController],
  providers: [AiKeysService],
  exports: [AiKeysService],
})
export class AiKeysModule {}
