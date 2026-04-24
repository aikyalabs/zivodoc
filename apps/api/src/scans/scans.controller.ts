import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import {
  apiCreatedResponse,
  apiOkResponse,
  apiPaginatedResponse,
  CreatedResponse,
} from '@src/api-response.helper';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import { clampPagination } from '@src/pagination.helper';
import {
  TriggerScanRequest,
  ScanResponse,
  ScansResponse,
  FindingsResponse,
  UpdateFindingRequest,
} from '@src/scans/scans.dto';
import { ScansService } from '@src/scans/scans.service';

import { FindingCategory, FindingSeverity, FindingStatus } from '@zivodoc/shared';

@Controller()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Get('dashboard/stats')
  async dashboardStats(@RequestUser() user: AuthUser) {
    const stats = await this.scansService.getDashboardStats(user);
    const topFindings = await this.scansService.getTopFindings(user);
    return apiOkResponse({ ...stats, topFindings });
  }

  @ZodResponse({ type: CreatedResponse })
  @Post('projects/:projectId/scans')
  async trigger(
    @RequestUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() body: TriggerScanRequest,
  ) {
    const scan = await this.scansService.trigger(projectId, body, user);
    return apiCreatedResponse(scan.id);
  }

  @ZodResponse({ type: ScansResponse })
  @Get('projects/:projectId/scans')
  async listByProject(
    @RequestUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pagination = clampPagination(limit, offset);
    const [items, total] = await this.scansService.listByProject(projectId, user, pagination);
    return apiPaginatedResponse(items, Number(total));
  }

  @ZodResponse({ type: ScanResponse })
  @Get('scans/:id')
  async findOne(@RequestUser() user: AuthUser, @Param('id') id: string) {
    const scan = await this.scansService.findById(id, user);
    return apiOkResponse(scan);
  }

  @ZodResponse({ type: FindingsResponse })
  @Get('scans/:id/findings')
  async getFindings(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Query('category') category?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pagination = clampPagination(limit, offset);
    const [items, total] = await this.scansService.getFindings(id, user, {
      category: category as FindingCategory | undefined,
      severity: severity as FindingSeverity | undefined,
      status: status as FindingStatus | undefined,
      ...pagination,
    });
    return apiPaginatedResponse(items, Number(total));
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('findings/:id')
  async updateFinding(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateFindingRequest,
  ) {
    await this.scansService.updateFindingStatus(id, body.status, user);
  }
}
