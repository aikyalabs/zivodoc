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
}
