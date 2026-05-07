import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import {
  GitHubInstallationRepository,
  GitHubRepoLinkRepository,
  ProjectRepository,
  OrganizationRepository,
} from '@db/repositories';
import { GitHubInstallationEntity, GitHubRepoLinkEntity } from '@db/entities';
import { Caller } from '@src/auth/request-user.decorator';
import { GitHubAppService, type GitHubRepo } from './github-app.service';

interface LinkRepoParams {
  installationId: number;
  repoId: number;
  repoFullName: string;
  repoDefaultBranch?: string;
  repoPrivate?: boolean;
  repoCloneUrl?: string;
  projectId?: string;
}

@Injectable()
export class GitHubInstallationService {
  constructor(
    private readonly installationRepo: GitHubInstallationRepository,
    private readonly repoLinkRepo: GitHubRepoLinkRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly githubApp: GitHubAppService,
  ) {}

  async handleInstallationCreated(
    installationId: number,
    account: { login: string; type: string; avatar_url?: string },
    permissions: unknown,
    repositorySelection: string,
    caller: Caller,
  ): Promise<GitHubInstallationEntity> {
    const existing = await this.installationRepo.findByInstallationId(installationId);
    if (existing) {
      existing.accountLogin = account.login;
      existing.accountType = account.type;
      existing.accountAvatarUrl = account.avatar_url ?? null;
      existing.permissions = permissions;
      existing.repositorySelection = repositorySelection;
      existing.suspendedAt = null;
      await this.installationRepo.save(existing);
      return existing;
    }

    const entity = this.installationRepo.create({
      installationId,
      accountLogin: account.login,
      accountType: account.type,
      accountAvatarUrl: account.avatar_url ?? null,
      organizationId: caller.organizationId!,
      installedById: caller.id,
      permissions,
      repositorySelection,
    });
    return this.installationRepo.save(entity);
  }

  async listInstallations(caller: Caller): Promise<GitHubInstallationEntity[]> {
    if (!caller.organizationId) return [];
    return this.installationRepo.findByOrganizationId(caller.organizationId);
  }

  async listRepos(
    installationId: number,
    caller: Caller,
  ): Promise<(GitHubRepo & { isLinked: boolean })[]> {
    const installation = await this.installationRepo.findByInstallationId(installationId);
    if (!installation) throw new NotFoundException('Installation not found.');
    if (installation.organizationId !== caller.organizationId) {
      throw new NotFoundException('Installation not found.');
    }

    const repos = await this.githubApp.listInstallationRepos(installationId);
    const links = await this.repoLinkRepo.findByInstallationId(installationId);
    const linkedRepoIds = new Set(links.map((l) => l.repoId));

    return repos.map((r) => ({ ...r, isLinked: linkedRepoIds.has(r.id) }));
  }

  async linkRepoToProject(data: LinkRepoParams, caller: Caller): Promise<GitHubRepoLinkEntity> {
    const installation = await this.installationRepo.findByInstallationId(data.installationId);
    if (!installation) throw new NotFoundException('Installation not found.');
    if (installation.organizationId !== caller.organizationId) {
      throw new NotFoundException('Installation not found.');
    }

    const existingLink = await this.repoLinkRepo.findByRepoId(
      data.repoId,
      installation.organizationId,
    );
    if (existingLink) throw new ConflictException('This repo is already linked to a project.');

    let projectId = data.projectId;

    if (!projectId) {
      const repoName = data.repoFullName.split('/').pop() ?? data.repoFullName;
      const project = this.projectRepo.create({
        name: repoName,
        repoUrl: data.repoCloneUrl ?? `https://github.com/${data.repoFullName}.git`,
        defaultBranch: data.repoDefaultBranch ?? 'main',
        scanMode: 'repo',
        organizationId: installation.organizationId,
      });
      const saved = await this.projectRepo.save(project);
      projectId = saved.id;
    }

    const link = this.repoLinkRepo.create({
      installationId: data.installationId,
      repoId: data.repoId,
      repoFullName: data.repoFullName,
      repoDefaultBranch: data.repoDefaultBranch ?? 'main',
      repoPrivate: data.repoPrivate ?? false,
      projectId,
      organizationId: installation.organizationId,
    });
    return this.repoLinkRepo.save(link);
  }

  async unlinkRepo(projectId: string, caller: Caller): Promise<void> {
    const link = await this.repoLinkRepo.findByProjectId(projectId);
    if (!link) throw new NotFoundException('Repo link not found.');
    if (link.organizationId !== caller.organizationId) {
      throw new NotFoundException('Repo link not found.');
    }
    await this.repoLinkRepo.remove(link);
  }

  async removeInstallation(installationId: number): Promise<void> {
    const installation = await this.installationRepo.findByInstallationId(installationId);
    if (!installation) return;
    const links = await this.repoLinkRepo.findByInstallationId(installationId);
    if (links.length > 0) await this.repoLinkRepo.remove(links);
    await this.installationRepo.remove(installation);
  }

  async suspendInstallation(installationId: number): Promise<void> {
    const installation = await this.installationRepo.findByInstallationId(installationId);
    if (installation)
      await this.installationRepo.update(installation.id, { suspendedAt: new Date() });
  }

  async unsuspendInstallation(installationId: number): Promise<void> {
    const installation = await this.installationRepo.findByInstallationId(installationId);
    if (installation) await this.installationRepo.update(installation.id, { suspendedAt: null });
  }
}
