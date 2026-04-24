import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProjectEntity } from '../entities/project.entity';
import { ScanEntity } from '../entities/scan.entity';

export interface ProjectWithStats {
  project: ProjectEntity;
  lastScanStatus: string | null;
  lastScanDate: Date | null;
  totalScans: number;
  totalFindings: number;
}

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

  async findWithStats(
    where: { organizationId?: string },
    options?: { limit?: number; offset?: number },
  ): Promise<[ProjectWithStats[], number]> {
    const qb = this.createQueryBuilder('p');

    if (where.organizationId) {
      qb.where('p.organizationId = :orgId', { orgId: where.organizationId });
    }

    const total = await qb.getCount();

    qb.orderBy('p.createdAt', 'DESC')
      .take(options?.limit ?? 20)
      .skip(options?.offset ?? 0);

    const projects = await qb.getMany();

    // Fetch stats for each project using TypeORM
    const scanRepo = this.manager.getRepository(ScanEntity);
    const results: ProjectWithStats[] = [];

    for (const project of projects) {
      const [latestScan, totalScans] = await Promise.all([
        scanRepo.findOne({
          where: { projectId: project.id },
          order: { createdAt: 'DESC' },
          select: ['status', 'completedAt', 'findingsCount'],
        }),
        scanRepo.count({ where: { projectId: project.id } }),
      ]);

      results.push({
        project,
        lastScanStatus: latestScan?.status ?? null,
        lastScanDate: latestScan?.completedAt ?? null,
        totalScans,
        totalFindings: latestScan?.findingsCount ?? 0,
      });
    }

    return [results, total];
  }
}
