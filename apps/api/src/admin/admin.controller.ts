import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { z } from 'zod';

import { apiOkResponse, apiPaginatedResponse } from '@src/api-response.helper';
import { Roles } from '@src/auth/roles.decorator';
import { PlanType as PlanTypeEnum, UserRole as UserRoleEnum } from '@zivodoc/shared';
import { AdminService } from './admin.service';

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

@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  async stats() {
    return apiOkResponse(await this.admin.getStats());
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

  @Get('audit-logs')
  async listAuditLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('search') search?: string,
  ) {
    const [logs, total] = await this.admin.listAuditLogs({
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
    return apiPaginatedResponse(logs, total);
  }
}
