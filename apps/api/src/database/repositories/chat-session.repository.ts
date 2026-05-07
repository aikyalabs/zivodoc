import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatSessionEntity } from '../entities/chat-session.entity';

@Injectable()
export class ChatSessionRepository extends Repository<ChatSessionEntity> {
  constructor(
    @InjectRepository(ChatSessionEntity)
    repository: Repository<ChatSessionEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }
}
