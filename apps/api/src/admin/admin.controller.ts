import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';

import { apiOkResponse, apiPaginatedResponse } from '@src/api-response.helper';
import { Roles } from '@src/auth/roles.decorator';
import { PlanType as PlanTypeEnum, UserRole as UserRoleEnum } from '@zivodoc/shared';
import { AdminService, type AuditLogFilters } from './admin.service';

const updateUserSchema = z.object({
  role: z.enum(UserRoleEnum).optional(),
  isDisabled: z.boolean().optional(),
  organizationId: z.string().nullable().optional(),
});

const updateOrgSchema = z.object({
  plan: z.enum(PlanTypeEnum).optional(),
  scanQuota: z.number().int().min(0).optional(),
  maxProjects: z.number().int().min(0).optional(),
  maxPages: z.number().int().min(0).optional(),
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
  actorId: z.string().optional(),
  method: z.string().optional(),
  statusBucket: z.enum(['2xx', '4xx', '5xx']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  async stats() {
    return apiOkResponse(await this.admin.getStats());
  }

  @Get('scans/summary')
  async scanSummary() {
    return apiOkResponse(await this.admin.getScanSummary());
  }

  @Get('users')
  async listUsers(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    const [users, total] = await this.admin.listUsers({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
    return apiPaginatedResponse(
      users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        organizationId: u.organizationId,
        isDisabled: u.isDisabled,
        onboardingCompleted: u.onboardingCompleted,
        createdAt: u.createdAt,
      })),
      total,
    );
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateUserSchema.parse(body);
    const user = await this.admin.updateUser(id, parsed);
    return apiOkResponse({
      id: user.id,
      role: user.role,
      isDisabled: user.isDisabled,
      organizationId: user.organizationId,
    });
  }

  @Get('organizations')
  async listOrganizations(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    const [orgs, total] = await this.admin.listOrganizations({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
    return apiPaginatedResponse(
      orgs.map((o) => ({
        id: o.id,
        name: o.name,
        slug: o.slug,
        plan: o.plan,
        scanQuota: o.scanQuota,
        scansUsedThisMonth: o.scansUsedThisMonth,
        maxPages: o.maxPages,
        maxProjects: o.maxProjects,
        createdAt: o.createdAt,
      })),
      total,
    );
  }

  @Patch('organizations/:id')
  async updateOrganization(@Param('id') id: string, @Body() body: unknown) {
    const parsed = updateOrgSchema.parse(body);
    const org = await this.admin.updateOrganization(id, parsed);
    return apiOkResponse({
      id: org.id,
      plan: org.plan,
      scanQuota: org.scanQuota,
      maxProjects: org.maxProjects,
      maxPages: org.maxPages,
    });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('organizations/:id')
  async deleteOrganization(@Param('id') id: string): Promise<void> {
    await this.admin.deleteOrganization(id);
  }

  @Get('organizations/:id/detail')
  async organizationDetail(@Param('id') id: string) {
    const detail = await this.admin.getOrganizationDetail(id);
    return apiOkResponse({
      organization: {
        id: detail.organization.id,
        name: detail.organization.name,
        slug: detail.organization.slug,
        plan: detail.organization.plan,
        scanQuota: detail.organization.scanQuota,
        scansUsedThisMonth: detail.organization.scansUsedThisMonth,
        maxPages: detail.organization.maxPages,
        maxProjects: detail.organization.maxProjects,
        createdAt: detail.organization.createdAt,
      },
      users: detail.users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isDisabled: u.isDisabled,
      })),
      projects: detail.projects.map((p) => ({
        id: p.id,
        name: p.name,
        siteUrl: p.siteUrl,
        repoUrl: p.repoUrl,
        scanMode: p.scanMode,
      })),
      recentScans: detail.recentScans.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        status: s.status,
        findingsCount: s.findingsCount,
        duration: s.duration,
        createdAt: s.createdAt,
      })),
    });
  }

  @Post('organizations/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendOrganization(@Param('id') id: string) {
    return apiOkResponse(await this.admin.suspendOrganization(id));
  }

  @Get('audit-logs')
  async listAuditLogs(@Query() query: unknown) {
    const filters = auditQuerySchema.parse(query) as AuditLogFilters;
    const [logs, total] = await this.admin.listAuditLogs(filters);
    return apiPaginatedResponse(logs, total);
  }
}
