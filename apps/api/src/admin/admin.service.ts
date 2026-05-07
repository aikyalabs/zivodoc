import { Injectable, NotFoundException } from '@nestjs/common';

import { AuditLogRepository, OrganizationRepository, UserRepository } from '@db/repositories';
import { OrganizationEntity, UserEntity, AuditLogEntity } from '@db/entities';
import type { PlanType, UserRole } from '@zivodoc/shared';

interface ListOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UserRepository,
    private readonly orgs: OrganizationRepository,
    private readonly auditLogs: AuditLogRepository,
  ) {}

  async listUsers(options: ListOptions): Promise<[UserEntity[], number]> {
    const limit = options.limit ?? 25;
    const offset = options.offset ?? 0;
    const qb = this.users.createQueryBuilder('user').orderBy('user.createdAt', 'DESC');
    if (options.search) {
      qb.andWhere('(user.email ILIKE :s OR user.firstName ILIKE :s OR user.lastName ILIKE :s)', {
        s: `%${options.search}%`,
      });
    }
    return qb.skip(offset).take(limit).getManyAndCount();
  }

  async getUser(id: string): Promise<UserEntity> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updateUser(
    id: string,
    data: { role?: UserRole; isDisabled?: boolean; organizationId?: string | null },
  ): Promise<UserEntity> {
    const user = await this.getUser(id);
    if (data.role !== undefined) user.role = data.role;
    if (data.isDisabled !== undefined) user.isDisabled = data.isDisabled;
    if (data.organizationId !== undefined) user.organizationId = data.organizationId;
    return this.users.save(user);
  }

  async listOrganizations(options: ListOptions): Promise<[OrganizationEntity[], number]> {
    const limit = options.limit ?? 25;
    const offset = options.offset ?? 0;
    const qb = this.orgs.createQueryBuilder('org').orderBy('org.createdAt', 'DESC');
    if (options.search) {
      qb.andWhere('(org.name ILIKE :s OR org.slug ILIKE :s)', { s: `%${options.search}%` });
    }
    return qb.skip(offset).take(limit).getManyAndCount();
  }

  async getOrganization(id: string): Promise<OrganizationEntity> {
    const org = await this.orgs.findOne({ where: { id } });
    if (!org) throw new NotFoundException('Organization not found.');
    return org;
  }

  async updateOrganization(
    id: string,
    data: { plan?: PlanType; scanQuota?: number; maxProjects?: number; maxPages?: number },
  ): Promise<OrganizationEntity> {
    const org = await this.getOrganization(id);
    if (data.plan !== undefined) org.plan = data.plan;
    if (data.scanQuota !== undefined) org.scanQuota = data.scanQuota;
    if (data.maxProjects !== undefined) org.maxProjects = data.maxProjects;
    if (data.maxPages !== undefined) org.maxPages = data.maxPages;
    return this.orgs.save(org);
  }

  async deleteOrganization(id: string): Promise<void> {
    const org = await this.getOrganization(id);
    await this.orgs.remove(org);
  }

  async listAuditLogs(options: ListOptions): Promise<[AuditLogEntity[], number]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const qb = this.auditLogs.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');
    if (options.search) {
      qb.andWhere('(log.action ILIKE :s OR log.path ILIKE :s OR log.actorId = :exact)', {
        s: `%${options.search}%`,
        exact: options.search,
      });
    }
    return qb.skip(offset).take(limit).getManyAndCount();
  }

  async getStats(): Promise<{
    totalUsers: number;
    totalOrgs: number;
    activeUsers: number;
    disabledUsers: number;
  }> {
    const [totalUsers, totalOrgs, disabledUsers] = await Promise.all([
      this.users.count(),
      this.orgs.count(),
      this.users.count({ where: { isDisabled: true } }),
    ]);
    return {
      totalUsers,
      totalOrgs,
      activeUsers: totalUsers - disabledUsers,
      disabledUsers,
    };
  }
}
