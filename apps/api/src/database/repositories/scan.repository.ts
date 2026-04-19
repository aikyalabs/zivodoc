import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ScanEntity } from '../entities/scan.entity';

@Injectable()
export class ScanRepository extends Repository<ScanEntity> {
  constructor(
    @InjectRepository(ScanEntity)
    repository: Repository<ScanEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
  }

  async findByProjectId(projectId: string): Promise<ScanEntity[]> {
    return this.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestByProjectId(projectId: string): Promise<ScanEntity | null> {
    return this.findOne({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }
}
