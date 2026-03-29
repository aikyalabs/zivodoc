import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrganizationEntity } from '@db/entities';
import { OrganizationRepository } from '@db/repositories';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';

@Injectable()
export class OrganizationsService {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  public async create(data: { name: string; slug: string }) {
    const existing = await this.organizationRepository.findBySlug(data.slug);
    if (existing) {
      throw new BadRequestException('Organization slug already in use.');
    }

    const org = this.organizationRepository.create(data);
    return this.organizationRepository.save(org);
  }

  public async findById(id: string, caller: Caller) {
    const org = await this.organizationRepository.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found.');
    if (!isAdmin(caller) && org.id !== caller.organizationId) {
      throw new ForbiddenException('Access denied to this organization.');
    }
    return org;
  }

  public async list(
    caller: Caller,
    options?: { limit?: number; offset?: number },
  ): Promise<[OrganizationEntity[], number]> {
    if (!isAdmin(caller) && !caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }
    const where = isAdmin(caller) ? {} : { id: caller.organizationId! };
    const [items, total] = await this.organizationRepository.findAndCount({
      where,
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
      order: { createdAt: 'DESC' },
    });

    return [items, total];
  }

  public async update(id: string, data: { name?: string; slug?: string }, caller: Caller) {
    if (!isAdmin(caller) && id !== caller.organizationId) {
      throw new ForbiddenException('Access denied to this organization.');
    }

    if (data.slug) {
      const existing = await this.organizationRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Organization slug already in use.');
      }
    }

    const result = await this.organizationRepository.update(id, data);
    if (result.affected === 0) throw new NotFoundException('Organization not found.');
  }

  public async remove(_id: string): Promise<never> {
    throw new BadRequestException('Organization deletion is not supported. Contact support.');
  }
}
