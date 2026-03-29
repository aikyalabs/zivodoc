import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class SessionRepository extends Repository<SessionEntity> {
  constructor(
    @InjectRepository(SessionEntity)
    repository: Repository<SessionEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findValidSession(token: string): Promise<SessionEntity | null> {
    return this.findOne({
      where: {
        token,
        expiresAt: MoreThanOrEqual(new Date()),
      },
      relations: ['user'],
    });
  }
}
