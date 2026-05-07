import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { In } from 'typeorm';

import { ScanRepository } from '@db/repositories';
import { GitHubRepoLinkRepository } from '@db/repositories';
import { GitHubInstallationService } from './github-installation.service';

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(
    private readonly installationService: GitHubInstallationService,
    private readonly repoLinkRepo: GitHubRepoLinkRepository,
    private readonly scanRepo: ScanRepository,
    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  async handleEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    switch (event) {
      case 'installation':
        await this.handleInstallation(payload);
        break;
      case 'installation_repositories':
        await this.handleInstallationRepos(payload);
        break;
      case 'push':
        await this.handlePush(payload);
        break;
      case 'pull_request':
        await this.handlePullRequest(payload);
        break;
      default:
        this.logger.debug(`Ignoring event: ${event}`);
    }
  }

  private async handleInstallation(payload: Record<string, unknown>): Promise<void> {
    const action = payload.action as string;
    const installation = payload.installation as { id: number };

    switch (action) {
      case 'deleted':
        await this.installationService.removeInstallation(installation.id);
        this.logger.log(`Installation ${installation.id} removed`);
        break;
      case 'suspend':
        await this.installationService.suspendInstallation(installation.id);
        break;
      case 'unsuspend':
        await this.installationService.unsuspendInstallation(installation.id);
        break;
    }
  }

  private async handleInstallationRepos(payload: Record<string, unknown>): Promise<void> {
    const action = payload.action as string;
    if (action !== 'removed') return;

    const removed = (payload.repositories_removed as Array<{ id: number }>) ?? [];
    for (const repo of removed) {
      const links = await this.repoLinkRepo.find({ where: { repoId: repo.id } });
      if (links.length > 0) {
        await this.repoLinkRepo.remove(links);
        this.logger.log(`Unlinked repo ${repo.id} (removed from installation)`);
      }
    }
  }

  private async handlePush(payload: Record<string, unknown>): Promise<void> {
    const ref = payload.ref as string;
    const repo = payload.repository as { id: number; full_name: string; default_branch: string };
    const headCommit = payload.head_commit as { id: string } | null;

    if (!ref.endsWith(`/${repo.default_branch}`)) return;

    const link = await this.repoLinkRepo.find({ where: { repoId: repo.id } });
    if (link.length === 0) return;

    for (const repoLink of link) {
      if (!repoLink.webhookEnabled) continue;

      const hasActiveScan = await this.scanRepo.findOne({
        where: { projectId: repoLink.projectId, status: In(['pending', 'running']) },
      });
      if (hasActiveScan) continue;

      const scan = this.scanRepo.create({
        projectId: repoLink.projectId,
        organizationId: repoLink.organizationId,
        mode: 'repo',
        status: 'pending',
        branch: repo.default_branch,
        commitSha: headCommit?.id ?? null,
        triggerSource: 'webhook',
      });
      const saved = await this.scanRepo.save(scan);

      await this.scanQueue.add(
        'scan.execute',
        {
          scanId: saved.id,
          projectId: repoLink.projectId,
          organizationId: repoLink.organizationId,
          repoUrl: `https://github.com/${repo.full_name}.git`,
          branch: repo.default_branch,
          scanMode: 'repo',
          maxPages: 500,
          githubInstallationId: repoLink.installationId,
          commitSha: headCommit?.id,
          repoFullName: repo.full_name,
          checkRunsEnabled: repoLink.checkRunsEnabled,
          prCommentsEnabled: repoLink.prCommentsEnabled,
        },
        { attempts: 1, removeOnComplete: true, removeOnFail: false },
      );

      this.logger.log(`Webhook scan triggered for ${repo.full_name} → ${saved.id}`);
    }
  }

  private async handlePullRequest(payload: Record<string, unknown>): Promise<void> {
    const action = payload.action as string;
    if (action !== 'opened' && action !== 'synchronize') return;

    const pr = payload.pull_request as {
      number: number;
      head: { sha: string; ref: string };
    };
    const repo = payload.repository as { id: number; full_name: string };

    const links = await this.repoLinkRepo.find({ where: { repoId: repo.id } });
    if (links.length === 0) return;

    for (const link of links) {
      if (!link.webhookEnabled) continue;

      const hasActiveScan = await this.scanRepo.findOne({
        where: { projectId: link.projectId, status: In(['pending', 'running']) },
      });
      if (hasActiveScan) continue;

      const scan = this.scanRepo.create({
        projectId: link.projectId,
        organizationId: link.organizationId,
        mode: 'repo',
        status: 'pending',
        branch: pr.head.ref,
        commitSha: pr.head.sha,
        triggerSource: 'webhook',
      });
      const saved = await this.scanRepo.save(scan);

      await this.scanQueue.add(
        'scan.execute',
        {
          scanId: saved.id,
          projectId: link.projectId,
          organizationId: link.organizationId,
          repoUrl: `https://github.com/${repo.full_name}.git`,
          branch: pr.head.ref,
          scanMode: 'repo',
          maxPages: 500,
          githubInstallationId: link.installationId,
          commitSha: pr.head.sha,
          prNumber: pr.number,
          repoFullName: repo.full_name,
          checkRunsEnabled: link.checkRunsEnabled,
          prCommentsEnabled: link.prCommentsEnabled,
        },
        { attempts: 1, removeOnComplete: true, removeOnFail: false },
      );

      this.logger.log(`PR scan triggered for ${repo.full_name}#${pr.number} → ${saved.id}`);
    }
  }
}
