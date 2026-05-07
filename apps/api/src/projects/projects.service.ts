import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ScanMode, FindingCategory, FindingSeverity, FindingStatus } from '@zivodoc/shared';

import { ProjectEntity } from '@db/entities';
import { ProjectRepository, type ProjectWithStats } from '@db/repositories';
import { OrganizationRepository, FindingRepository } from '@db/repositories';
import { Caller } from '@src/auth/request-user.decorator';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly findingRepository: FindingRepository,
  ) {}

  public async create(
    data: {
      name: string;
      siteUrl?: string | null;
      repoUrl?: string | null;
      defaultBranch?: string;
      docPaths?: string[];
      scanMode?: ScanMode;
      maxPages?: number;
      openapiSpecUrl?: string | null;
    },
    caller: Caller,
  ) {
    if (!caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }

    const organizationId = caller.organizationId;

    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (!org) throw new NotFoundException('Organization not found.');

    const currentCount = await this.projectRepository.countByOrganizationId(organizationId);
    if (currentCount >= org.maxProjects) {
      throw new BadRequestException(
        `Project limit reached (${org.maxProjects}). Upgrade your plan for more projects.`,
      );
    }

    if (!data.siteUrl && !data.repoUrl) {
      throw new BadRequestException('Either a site URL or repo URL is required.');
    }

    const project = this.projectRepository.create({
      name: data.name,
      siteUrl: data.siteUrl ?? null,
      repoUrl: data.repoUrl ?? null,
      defaultBranch: data.defaultBranch ?? 'main',
      docPaths: data.docPaths ?? ['docs/', 'README.md'],
      scanMode: data.scanMode ?? 'site',
      maxPages: data.maxPages ?? 500,
      openapiSpecUrl: data.openapiSpecUrl ?? null,
      organizationId,
    });

    return this.projectRepository.save(project);
  }

  public async findById(id: string, caller: Caller) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  public async list(
    caller: Caller,
    options?: { limit?: number; offset?: number },
  ): Promise<[ProjectWithStats[], number]> {
    if (!caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }
    const where = { organizationId: caller.organizationId };
    return this.projectRepository.findWithStats(where, options);
  }

  public async update(
    id: string,
    data: Partial<
      Pick<
        ProjectEntity,
        | 'name'
        | 'siteUrl'
        | 'repoUrl'
        | 'defaultBranch'
        | 'docPaths'
        | 'scanMode'
        | 'maxPages'
        | 'scanSchedule'
        | 'openapiSpecUrl'
      >
    >,
    caller: Caller,
  ) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectRepository.update(id, data);
  }

  public async remove(id: string, caller: Caller) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectRepository.remove(project);
  }

  public async getFindings(
    projectId: string,
    caller: Caller,
    filters: {
      category?: FindingCategory;
      severity?: FindingSeverity;
      status?: FindingStatus;
      limit?: number;
      offset?: number;
    },
  ) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    return this.findingRepository.findByProjectId(
      projectId,
      { category: filters.category, severity: filters.severity, status: filters.status },
      filters.limit ?? 25,
      filters.offset ?? 0,
    );
  }

  public async exportFindingsCsv(projectId: string, caller: Caller): Promise<string> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found.');
    if (project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    const [findings] = await this.findingRepository.findByProjectId(projectId, {}, 10000, 0);

    const header = 'Severity,Category,Status,Title,Source,Line,Description,Suggestion';
    const rows = findings.map((f) =>
      [
        f.severity,
        f.category,
        f.status,
        `"${f.title.replace(/"/g, '""')}"`,
        f.source,
        f.line,
        `"${f.description.replace(/"/g, '""')}"`,
        `"${(f.suggestion ?? '').replace(/"/g, '""')}"`,
      ].join(','),
    );

    return [header, ...rows].join('\n');
  }
}
