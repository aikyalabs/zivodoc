import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GitHubRepoLinkEntity } from '../entities/github-repo-link.entity';

@Injectable()
export class GitHubRepoLinkRepository extends Repository<GitHubRepoLinkEntity> {
  constructor(
    @InjectRepository(GitHubRepoLinkEntity)
    repository: Repository<GitHubRepoLinkEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByProjectId(projectId: string): Promise<GitHubRepoLinkEntity | null> {
    return this.findOne({ where: { projectId } });
  }

  async findByRepoId(repoId: number, organizationId: string): Promise<GitHubRepoLinkEntity | null> {
    return this.findOne({ where: { repoId, organizationId } });
  }

  async findByInstallationId(installationId: number): Promise<GitHubRepoLinkEntity[]> {
    return this.find({ where: { installationId } });
  }
}
