import crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { In } from 'typeorm';

import { ScanEntity } from '@db/entities';
import {
  ScanRepository,
  FindingRepository,
  ProjectRepository,
  OrganizationRepository,
  GitHubRepoLinkRepository,
} from '@db/repositories';
import { Caller } from '@src/auth/request-user.decorator';
import { FindingCategory, FindingSeverity, FindingStatus, ScanMode } from '@zivodoc/shared';

@Injectable()
export class ScansService {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly findingRepository: FindingRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly repoLinkRepository: GitHubRepoLinkRepository,
    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  public async trigger(
    projectId: string,
    data: { mode?: ScanMode; branch?: string },
    caller: Caller,
  ): Promise<ScanEntity> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    const activeScan = await this.scanRepository.findOne({
      where: { projectId, status: In(['pending', 'running']) },
    });
    if (activeScan) {
      throw new ConflictException(
        'A scan is already running for this project. Wait for it to complete.',
      );
    }

    const org = await this.organizationRepository.findOne({
      where: { id: project.organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found.');

    this.resetQuotaIfNewMonth(org);

    if (org.scansUsedThisMonth >= org.scanQuota) {
      throw new BadRequestException(
        `Scan quota reached (${org.scanQuota}/month). Upgrade your plan for more scans.`,
      );
    }

    const scan = this.scanRepository.create({
      projectId: project.id,
      organizationId: project.organizationId,
      mode: data.mode ?? project.scanMode,
      status: 'pending',
      branch: data.branch ?? project.defaultBranch,
    });

    const saved = await this.scanRepository.save(scan);

    const repoLink = await this.repoLinkRepository.findByProjectId(project.id);

    // Enqueue FIRST, increment quota AFTER — if enqueue fails, quota isn't wasted
    await this.scanQueue.add(
      'scan.execute',
      {
        scanId: saved.id,
        projectId: project.id,
        organizationId: project.organizationId,
        siteUrl: project.siteUrl,
        repoUrl: project.repoUrl,
        branch: data.branch ?? project.defaultBranch,
        docPaths: project.docPaths,
        scanMode: saved.mode,
        maxPages: project.maxPages,
        openapiSpecUrl: project.openapiSpecUrl,
        ...(repoLink && {
          githubInstallationId: repoLink.installationId,
          repoFullName: repoLink.repoFullName,
          checkRunsEnabled: repoLink.checkRunsEnabled,
          prCommentsEnabled: repoLink.prCommentsEnabled,
        }),
      },
      { attempts: 1, removeOnComplete: true, removeOnFail: false },
    );

    await this.organizationRepository.increment(
      { id: project.organizationId },
      'scansUsedThisMonth',
      1,
    );

    return saved;
  }

  public async uploadResults(
    projectId: string,
    data: {
      pagesScanned: number;
      codeBlocksFound: number;
      linksChecked: number;
      duration: number;
      triggerSource?: string;
      findings: Array<{
        category: string;
        severity: string;
        confidence: string;
        source: string;
        line: number;
        title: string;
        description: string;
        suggestion?: string;
        evidence?: Record<string, unknown>;
      }>;
    },
    caller: Caller,
  ): Promise<ScanEntity> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    const errorCount = data.findings.filter((f) => f.severity === 'error').length;
    const warningCount = data.findings.filter((f) => f.severity === 'warning').length;
    const infoCount = data.findings.filter((f) => f.severity === 'info').length;

    const scan = this.scanRepository.create({
      projectId: project.id,
      organizationId: project.organizationId,
      mode: project.scanMode,
      status: 'completed',
      triggerSource: data.triggerSource ?? 'cli',
      pagesScanned: data.pagesScanned,
      codeBlocksFound: data.codeBlocksFound,
      linksChecked: data.linksChecked,
      findingsCount: errorCount + warningCount,
      errorCount,
      warningCount,
      infoCount,
      duration: data.duration,
      startedAt: new Date(Date.now() - data.duration),
      completedAt: new Date(),
    });
    const saved = await this.scanRepository.save(scan);

    if (data.findings.length > 0) {
      const { FindingEntity } = await import('@db/entities');
      const entities = data.findings.map((f) => {
        const entity = new FindingEntity();
        entity.scanId = saved.id;
        entity.projectId = project.id;
        entity.organizationId = project.organizationId;
        entity.category = f.category as FindingCategory;
        entity.severity = f.severity as FindingSeverity;
        entity.source = f.source;
        entity.line = f.line ?? 0;
        entity.title = f.title;
        entity.description = f.description;
        entity.suggestion = f.suggestion ?? null;
        entity.status = 'open';
        entity.fingerprint = `${f.category}|${f.source}|${f.line}`;
        entity.firstSeenScanId = saved.id;
        entity.lastSeenScanId = saved.id;
        entity.seenCount = 1;
        entity.rawData = { confidence: f.confidence, evidence: f.evidence ?? null };
        return entity;
      });

      for (let i = 0; i < entities.length; i += 100) {
        await this.findingRepository.save(entities.slice(i, i + 100));
      }
    }

    return saved;
  }

  public async findById(id: string, caller: Caller): Promise<ScanEntity> {
    const scan = await this.scanRepository.findOne({ where: { id } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (scan.organizationId !== caller.organizationId) {
      throw new NotFoundException('Scan not found.');
    }
    return scan;
  }

  public async listByProject(
    projectId: string,
    caller: Caller,
    options?: { limit?: number; offset?: number },
  ): Promise<[ScanEntity[], number]> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    return this.scanRepository.findAndCount({
      where: { projectId },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { createdAt: 'DESC' },
    });
  }

  public async getFindings(
    scanId: string,
    caller: Caller,
    filters: {
      category?: FindingCategory;
      severity?: FindingSeverity;
      status?: FindingStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    const scan = await this.scanRepository.findOne({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (scan.organizationId !== caller.organizationId) {
      throw new NotFoundException('Scan not found.');
    }

    return this.findingRepository.findByScanId(
      scanId,
      { category: filters.category, severity: filters.severity, status: filters.status },
      filters.limit ?? 20,
      filters.offset ?? 0,
    );
  }

  public async enableShare(scanId: string, caller: Caller): Promise<{ token: string }> {
    const scan = await this.scanRepository.findOne({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (scan.organizationId !== caller.organizationId) {
      throw new NotFoundException('Scan not found.');
    }

    if (!scan.shareToken) {
      const token = crypto.randomBytes(24).toString('base64url');
      await this.scanRepository.update(scanId, { shareToken: token });
      return { token };
    }
    return { token: scan.shareToken };
  }

  public async disableShare(scanId: string, caller: Caller): Promise<void> {
    const scan = await this.scanRepository.findOne({ where: { id: scanId } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (scan.organizationId !== caller.organizationId) {
      throw new NotFoundException('Scan not found.');
    }
    await this.scanRepository.update(scanId, { shareToken: null });
  }

  public async findByShareToken(token: string): Promise<{
    scan: ScanEntity;
    projectName: string;
    findings: Array<{
      id: string;
      category: string;
      severity: string;
      source: string;
      line: number;
      title: string;
      description: string;
      status: string;
    }>;
  }> {
    const scan = await this.scanRepository.findOne({ where: { shareToken: token } });
    if (!scan) throw new NotFoundException('Shared scan not found.');

    const project = await this.projectRepository.findOne({ where: { id: scan.projectId } });
    if (!project) throw new NotFoundException('Shared scan not found.');

    const findings = await this.findingRepository.find({
      where: { scanId: scan.id, status: In(['open', 'reopened']) },
      order: { severity: 'ASC', createdAt: 'DESC' },
      take: 500,
    });

    return {
      scan,
      projectName: project.name,
      findings: findings.map((f) => ({
        id: f.id,
        category: f.category,
        severity: f.severity,
        source: f.source,
        line: f.line,
        title: f.title,
        description: f.description,
        status: f.status,
      })),
    };
  }

  public async updateFindingStatus(
    findingId: string,
    status: FindingStatus,
    caller: Caller,
  ): Promise<void> {
    const finding = await this.findingRepository.findOne({ where: { id: findingId } });
    if (!finding) throw new NotFoundException('Finding not found.');
    if (finding.organizationId !== caller.organizationId) {
      throw new NotFoundException('Finding not found.');
    }

    await this.findingRepository.update(findingId, { status });
  }

  // Reset quota on first access of a new month
  public async getDashboardStats(caller: Caller): Promise<{
    totalProjects: number;
    totalScans: number;
    openFindings: number;
    resolvedFindings: number;
    recentScans: ScanEntity[];
  }> {
    if (!caller.organizationId) {
      throw new NotFoundException('No organization context.');
    }
    const orgFilter = { organizationId: caller.organizationId };

    const [totalProjects, totalScans, openFindings, resolvedFindings, recentScans] =
      await Promise.all([
        this.projectRepository.count({ where: orgFilter }),
        this.scanRepository.count({ where: orgFilter }),
        this.findingRepository.count({ where: { ...orgFilter, status: In(['open', 'reopened']) } }),
        this.findingRepository.count({
          where: { ...orgFilter, status: In(['resolved', 'auto_resolved']) },
        }),
        this.scanRepository.find({
          where: orgFilter,
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);

    return { totalProjects, totalScans, openFindings, resolvedFindings, recentScans };
  }

  public async getTopFindings(caller: Caller, limit = 5) {
    if (!caller.organizationId) {
      throw new NotFoundException('No organization context.');
    }
    const orgFilter = { organizationId: caller.organizationId };

    return this.findingRepository.find({
      where: {
        ...orgFilter,
        status: In(['open', 'reopened']),
        severity: 'error' as FindingSeverity,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private resetQuotaIfNewMonth(org: {
    id: string;
    updatedAt: Date;
    scansUsedThisMonth: number;
  }): void {
    const now = new Date();
    const lastUpdate = new Date(org.updatedAt);
    if (
      now.getMonth() !== lastUpdate.getMonth() ||
      now.getFullYear() !== lastUpdate.getFullYear()
    ) {
      org.scansUsedThisMonth = 0;
      this.organizationRepository.update(org.id, { scansUsedThisMonth: 0 }).catch(() => {
        // Non-critical: quota will reset on next check
      });
    }
  }
}
