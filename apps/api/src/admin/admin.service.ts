import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Between, MoreThanOrEqual } from 'typeorm';

import {
  AiProviderKeyRepository,
  AuditLogRepository,
  GitHubInstallationRepository,
  OrganizationRepository,
  ProjectRepository,
  ScanRepository,
  SessionRepository,
  UserRepository,
} from '@db/repositories';
import {
  AiProviderKeyEntity,
  AuditLogEntity,
  GitHubInstallationEntity,
  OrganizationEntity,
  ProjectEntity,
  ScanEntity,
  SessionEntity,
  UserEntity,
} from '@db/entities';
import type { PlanType, ScanStatus, UserRole } from '@zivodoc/shared';

export interface ScanListFilters {
  limit?: number;
  offset?: number;
  status?: ScanStatus;
  organizationId?: string;
  startDate?: Date;
}

interface ListOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface AuditLogFilters extends ListOptions {
  actorId?: string;
  method?: string;
  statusBucket?: '2xx' | '4xx' | '5xx';
  startDate?: Date;
  endDate?: Date;
}

export interface ScanSummary {
  today: { total: number; completed: number; failed: number; running: number };
  week: { total: number; completed: number; failed: number };
  month: { total: number };
  topOrgs: { orgId: string; name: string; count: number }[];
}

export interface OrganizationDetail {
  organization: OrganizationEntity;
  users: UserEntity[];
  projects: ProjectEntity[];
  recentScans: ScanEntity[];
}

const STATUS_BUCKETS: Record<'2xx' | '4xx' | '5xx', [number, number]> = {
  '2xx': [200, 299],
  '4xx': [400, 499],
  '5xx': [500, 599],
};

@Injectable()
export class AdminService {
  constructor(
    private readonly users: UserRepository,
    private readonly orgs: OrganizationRepository,
    private readonly auditLogs: AuditLogRepository,
    private readonly scans: ScanRepository,
    private readonly projects: ProjectRepository,
    private readonly sessions: SessionRepository,
    private readonly githubInstalls: GitHubInstallationRepository,
    private readonly aiKeys: AiProviderKeyRepository,
    @InjectQueue('scan') private readonly scanQueue: Queue,
  ) {}

  async listGitHubInstallations(): Promise<
    (GitHubInstallationEntity & {
      organization: OrganizationEntity;
    })[]
  > {
    return this.githubInstalls.find({
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    }) as Promise<(GitHubInstallationEntity & { organization: OrganizationEntity })[]>;
  }

  async revokeGitHubInstallation(id: string): Promise<void> {
    const result = await this.githubInstalls.delete({ id });
    if (!result.affected) throw new NotFoundException('Installation not found.');
  }

  async listAiKeys(): Promise<(AiProviderKeyEntity & { organization: OrganizationEntity })[]> {
    return this.aiKeys.find({
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    }) as Promise<(AiProviderKeyEntity & { organization: OrganizationEntity })[]>;
  }

  async listActiveSessions(options: {
    limit?: number;
    offset?: number;
  }): Promise<[(SessionEntity & { user: UserEntity })[], number]> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const [rows, total] = await this.sessions.findAndCount({
      where: { expiresAt: MoreThanOrEqual(new Date()) },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip: offset,
      take: limit,
    });
    return [rows as (SessionEntity & { user: UserEntity })[], total];
  }

  async revokeSession(token: string): Promise<void> {
    const result = await this.sessions.delete({ token });
    if (!result.affected) throw new NotFoundException('Session not found.');
  }

  async revokeAllSessionsForUser(userId: string): Promise<{ revoked: number }> {
    const result = await this.sessions.delete({ userId });
    return { revoked: result.affected ?? 0 };
  }

  async getQueueSummary(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const counts = await this.scanQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
    };
  }

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

  async getOrganizationDetail(id: string): Promise<OrganizationDetail> {
    const organization = await this.getOrganization(id);
    const [users, projects, recentScans] = await Promise.all([
      this.users.find({ where: { organizationId: id }, order: { createdAt: 'DESC' } }),
      this.projects.find({ where: { organizationId: id }, order: { createdAt: 'DESC' } }),
      this.scans.find({
        where: { organizationId: id },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ]);
    return { organization, users, projects, recentScans };
  }

  async suspendOrganization(id: string): Promise<{ disabledCount: number }> {
    await this.getOrganization(id);
    const result = await this.users.update({ organizationId: id }, { isDisabled: true });
    return { disabledCount: result.affected ?? 0 };
  }

  async listAuditLogs(filters: AuditLogFilters): Promise<[AuditLogEntity[], number]> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const qb = this.auditLogs.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');

    if (filters.search) {
      qb.andWhere('(log.action ILIKE :s OR log.path ILIKE :s OR log.actorId = :exact)', {
        s: `%${filters.search}%`,
        exact: filters.search,
      });
    }
    if (filters.actorId) qb.andWhere('log.actorId = :aid', { aid: filters.actorId });
    if (filters.method) qb.andWhere('log.method = :m', { m: filters.method });
    if (filters.statusBucket) {
      const [lo, hi] = STATUS_BUCKETS[filters.statusBucket];
      qb.andWhere('log.statusCode BETWEEN :lo AND :hi', { lo, hi });
    }
    if (filters.startDate) qb.andWhere('log.createdAt >= :sd', { sd: filters.startDate });
    if (filters.endDate) qb.andWhere('log.createdAt <= :ed', { ed: filters.endDate });

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

  async getScanSummary(): Promise<ScanSummary> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const countByStatus = (since: Date, status: ScanStatus) =>
      this.scans.count({ where: { createdAt: Between(since, now), status } });

    const [
      todayTotal,
      todayCompleted,
      todayFailed,
      todayRunning,
      weekTotal,
      weekCompleted,
      weekFailed,
      monthTotal,
      topOrgs,
    ] = await Promise.all([
      this.scans.count({ where: { createdAt: Between(startOfDay, now) } }),
      countByStatus(startOfDay, 'completed'),
      countByStatus(startOfDay, 'failed'),
      countByStatus(startOfDay, 'running'),
      this.scans.count({ where: { createdAt: Between(startOfWeek, now) } }),
      countByStatus(startOfWeek, 'completed'),
      countByStatus(startOfWeek, 'failed'),
      this.scans.count({ where: { createdAt: Between(startOfMonth, now) } }),
      this.topOrgsByScansSince(startOfMonth),
    ]);

    return {
      today: {
        total: todayTotal,
        completed: todayCompleted,
        failed: todayFailed,
        running: todayRunning,
      },
      week: { total: weekTotal, completed: weekCompleted, failed: weekFailed },
      month: { total: monthTotal },
      topOrgs,
    };
  }

  async listScans(filters: ScanListFilters): Promise<[ScanEntity[], number]> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.organizationId) where.organizationId = filters.organizationId;
    if (filters.startDate) where.createdAt = Between(filters.startDate, new Date());
    return this.scans.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });
  }

  async cancelScan(id: string): Promise<ScanEntity> {
    const scan = await this.scans.findOne({ where: { id } });
    if (!scan) throw new NotFoundException('Scan not found.');
    if (!['pending', 'running'].includes(scan.status)) {
      throw new BadRequestException('Scan is already finished.');
    }
    scan.status = 'failed';
    scan.errorMessage = 'Cancelled by admin.';
    return this.scans.save(scan);
  }

  // Top-5 orgs by scan count needs SQL aggregation — Repository.find/count can't GROUP BY.
  private async topOrgsByScansSince(
    since: Date,
  ): Promise<{ orgId: string; name: string; count: number }[]> {
    const rows = await this.scans
      .createQueryBuilder('scan')
      .leftJoin('scan.organization', 'org')
      .select('scan.organizationId', 'orgId')
      .addSelect('org.name', 'name')
      .addSelect('COUNT(scan.id)', 'count')
      .where('scan.createdAt >= :since', { since })
      .groupBy('scan.organizationId')
      .addGroupBy('org.name')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany<{ orgId: string; name: string; count: string }>();
    return rows.map((r) => ({ orgId: r.orgId, name: r.name, count: Number(r.count) }));
  }
}
