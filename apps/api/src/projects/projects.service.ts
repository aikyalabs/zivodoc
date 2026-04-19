import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ScanMode } from '@zivodoc/shared';

import { ProjectEntity } from '@db/entities';
import { ProjectRepository } from '@db/repositories';
import { OrganizationRepository } from '@db/repositories';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly organizationRepository: OrganizationRepository,
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
    },
    caller: Caller,
  ) {
    if (!isAdmin(caller) && !caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }

    const organizationId = caller.organizationId!;

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
      organizationId,
    });

    return this.projectRepository.save(project);
  }

  public async findById(id: string, caller: Caller) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (!isAdmin(caller) && project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  public async list(
    caller: Caller,
    options?: { limit?: number; offset?: number },
  ): Promise<[ProjectEntity[], number]> {
    if (!isAdmin(caller) && !caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }
    const where = isAdmin(caller) ? {} : { organizationId: caller.organizationId! };
    return this.projectRepository.findAndCount({
      where,
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { createdAt: 'DESC' },
    });
  }

  public async update(
    id: string,
    data: Partial<
      Pick<
        ProjectEntity,
        'name' | 'siteUrl' | 'repoUrl' | 'defaultBranch' | 'docPaths' | 'scanMode' | 'maxPages'
      >
    >,
    caller: Caller,
  ) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (!isAdmin(caller) && project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectRepository.update(id, data);
  }

  public async remove(id: string, caller: Caller) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found.');
    if (!isAdmin(caller) && project.organizationId !== caller.organizationId) {
      throw new NotFoundException('Project not found.');
    }

    await this.projectRepository.remove(project);
  }
}
