import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChatMessageEntity } from '../entities/chat-message.entity';

@Injectable()
export class ChatMessageRepository extends Repository<ChatMessageEntity> {
  constructor(
    @InjectRepository(ChatMessageEntity)
    repository: Repository<ChatMessageEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findRecentByProject(projectId: string, limit = 100): Promise<ChatMessageEntity[]> {
    return this.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
