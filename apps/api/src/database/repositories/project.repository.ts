import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from '../entities/project.entity';

@Injectable()
export class ProjectRepository extends Repository<ProjectEntity> {
  constructor(
    @InjectRepository(ProjectEntity)
    repository: Repository<ProjectEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByOrganizationId(organizationId: string): Promise<ProjectEntity[]> {
    return this.find({ where: { organizationId } });
  }

  async countByOrganizationId(organizationId: string): Promise<number> {
    return this.count({ where: { organizationId } });
  }
}
