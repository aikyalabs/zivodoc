import { Module } from '@nestjs/common';

import { AiKeysModule } from '@src/ai-keys/ai-keys.module';

import { ChatBootstrapService } from './chat-bootstrap.service';
import { ChatController } from './chat.controller';
import { ChatIndexerService } from './chat-indexer.service';
import { ChatService } from './chat.service';
import { EmbeddingsService } from './embeddings.service';

@Module({
  imports: [AiKeysModule],
  controllers: [ChatController],
  providers: [ChatBootstrapService, EmbeddingsService, ChatIndexerService, ChatService],
  exports: [ChatIndexerService, EmbeddingsService],
})
export class ChatModule {}
