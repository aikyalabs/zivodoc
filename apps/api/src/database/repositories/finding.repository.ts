import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FindingCategory, FindingSeverity, FindingStatus } from '@zivodoc/shared';

import { FindingEntity } from '../entities/finding.entity';

export interface FindingFilters {
  category?: FindingCategory;
  severity?: FindingSeverity;
  status?: FindingStatus;
}

@Injectable()
export class FindingRepository extends Repository<FindingEntity> {
  constructor(
    @InjectRepository(FindingEntity)
    repository: Repository<FindingEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByScanId(
    scanId: string,
    filters: FindingFilters = {},
    take = 20,
    skip = 0,
  ): Promise<[FindingEntity[], number]> {
    const where: Record<string, unknown> = { scanId };
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    if (filters.status) where.status = filters.status;

    return this.findAndCount({
      where,
      order: { severity: 'ASC', createdAt: 'DESC' },
      take,
      skip,
    });
  }

  async findByProjectId(
    projectId: string,
    filters: FindingFilters = {},
    take = 25,
    skip = 0,
  ): Promise<[FindingEntity[], number]> {
    const qb = this.createQueryBuilder('f').where('f."projectId" = :projectId', { projectId });

    if (filters.category) qb.andWhere('f.category = :category', { category: filters.category });
    if (filters.severity) qb.andWhere('f.severity = :severity', { severity: filters.severity });

    if (filters.status) {
      qb.andWhere('f.status = :status', { status: filters.status });
    } else {
      // Default: show open + reopened (hide resolved/ignored/auto_resolved)
      qb.andWhere('f.status IN (:...statuses)', { statuses: ['open', 'reopened'] });
    }

    qb.orderBy('f.severity', 'ASC').addOrderBy('f."createdAt"', 'DESC').take(take).skip(skip);

    return qb.getManyAndCount();
  }
}
