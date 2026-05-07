import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiProviderKeyEntity, type AiProvider } from '../entities/ai-provider-key.entity';

@Injectable()
export class AiProviderKeyRepository extends Repository<AiProviderKeyEntity> {
  constructor(
    @InjectRepository(AiProviderKeyEntity)
    repository: Repository<AiProviderKeyEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByOrgAndProvider(
    organizationId: string,
    provider: AiProvider,
  ): Promise<AiProviderKeyEntity | null> {
    return this.findOne({ where: { organizationId, provider } });
  }

  async listByOrg(organizationId: string): Promise<AiProviderKeyEntity[]> {
    return this.find({ where: { organizationId }, order: { provider: 'ASC' } });
  }
}
