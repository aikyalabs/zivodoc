import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ApiKeyEntity } from '../entities/api-key.entity';

@Injectable()
export class ApiKeyRepository extends Repository<ApiKeyEntity> {
  constructor(
    @InjectRepository(ApiKeyEntity)
    repository: Repository<ApiKeyEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByHashedKey(hashedKey: string): Promise<ApiKeyEntity | null> {
    return this.findOne({
      where: { hashedKey, isActive: true },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<ApiKeyEntity[]> {
    return this.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
