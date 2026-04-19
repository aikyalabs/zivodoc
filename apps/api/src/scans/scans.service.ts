import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { ScanEntity } from '@db/entities';
import {
  ScanRepository,
  FindingRepository,
  ProjectRepository,
  OrganizationRepository,
} from '@db/repositories';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';
import { FindingCategory, FindingSeverity, FindingStatus, ScanMode } from '@zivodoc/shared';

@Injectable()
export class ScansService {
  constructor(
    private readonly scanRepository: ScanRepository,
    private readonly findingRepository: FindingRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly organizationRepository: OrganizationRepository,
    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  public async trigger(
    projectId: string,
    data: { mode?: ScanMode; branch?: string },
    caller: Caller,
  ) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (!isAdmin(caller) && project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    // Check scan quota
    const org = await this.organizationRepository.findOne({
      where: { id: project.organizationId },
    });
    if (!org) throw new NotFoundException('Organization not found.');

    if (org.scansUsedThisMonth >= org.scanQuota) {
      throw new BadRequestException(
        `Scan quota reached (${org.scanQuota}/month). Upgrade your plan for more scans.`,
      );
    }

    const scan = this.scanRepository.create({
      projectId: project.id,
      organizationId: project.organizationId,
      mode: (data.mode ?? project.scanMode) as ScanMode,
      status: 'pending',
      branch: data.branch ?? project.defaultBranch,
    });

    const saved = await this.scanRepository.save(scan);

    // Increment usage
    await this.organizationRepository.increment(
      { id: project.organizationId },
      'scansUsedThisMonth',
      1,
    );

    // Enqueue scan job for background processing
    await this.scanQueue.add('scan.execute', {
      scanId: saved.id,
      projectId: project.id,
      organizationId: project.organizationId,
      siteUrl: project.siteUrl,
      repoUrl: project.repoUrl,
      branch: data.branch ?? project.defaultBranch,
      docPaths: project.docPaths,
      scanMode: saved.mode,
      maxPages: project.maxPages,
    });

    return saved;
  }

  public async findById(id: string, caller: Caller) {
    const scan = await this.scanRepository.findOne({ where: { id } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (!isAdmin(caller) && scan.organizationId !== caller.organizationId) {
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
    if (!isAdmin(caller) && project.organizationId !== caller.organizationId) {
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
    if (!isAdmin(caller) && scan.organizationId !== caller.organizationId) {
      throw new NotFoundException('Scan not found.');
    }

    return this.findingRepository.findByScanId(
      scanId,
      { category: filters.category, severity: filters.severity, status: filters.status },
      filters.limit ?? 20,
      filters.offset ?? 0,
    );
  }

  public async updateFindingStatus(findingId: string, status: FindingStatus, caller: Caller) {
    const finding = await this.findingRepository.findOne({ where: { id: findingId } });
    if (!finding) throw new NotFoundException('Finding not found.');
    if (!isAdmin(caller) && finding.organizationId !== caller.organizationId) {
      throw new NotFoundException('Finding not found.');
    }

    await this.findingRepository.update(findingId, { status });
  }
}
