import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class RoleRepository extends Repository<RoleEntity> {
  constructor(
    @InjectRepository(RoleEntity)
    repository: Repository<RoleEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByOrganizationId(organizationId: string): Promise<RoleEntity[]> {
    return this.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
  }
}
