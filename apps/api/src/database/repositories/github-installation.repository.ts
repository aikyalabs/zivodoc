import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GitHubInstallationEntity } from '../entities/github-installation.entity';

@Injectable()
export class GitHubInstallationRepository extends Repository<GitHubInstallationEntity> {
  constructor(
    @InjectRepository(GitHubInstallationEntity)
    repository: Repository<GitHubInstallationEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByInstallationId(installationId: number): Promise<GitHubInstallationEntity | null> {
    return this.findOne({ where: { installationId } });
  }

  async findByOrganizationId(organizationId: string): Promise<GitHubInstallationEntity[]> {
    return this.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }
}
