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
import { ZodResponse } from 'nestjs-zod';

import {
  apiCreatedResponse,
  apiOkResponse,
  apiPaginatedResponse,
  CreatedResponse,
} from '@src/api-response.helper';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import { Public } from '@src/auth/public.decorator';
import { clampPagination } from '@src/pagination.helper';
import {
  TriggerScanRequest,
  ScanResponse,
  ScansResponse,
  FindingsResponse,
  UpdateFindingRequest,
  ScanShareTokenResponse,
  SharedScanResponse,
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

  @Post('projects/:projectId/scans/upload')
  async uploadScanResults(
    @RequestUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body()
    body: {
      pagesScanned: number;
      codeBlocksFound: number;
      linksChecked: number;
      duration: number;
      triggerSource?: string;
      findings: Array<{
        category: string;
        severity: string;
        confidence: string;
        source: string;
        line: number;
        title: string;
        description: string;
        suggestion?: string;
        evidence?: Record<string, unknown>;
      }>;
    },
  ) {
    const scan = await this.scansService.uploadResults(projectId, body, user);
    return apiOkResponse({ id: scan.id });
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

  @ZodResponse({ type: ScanShareTokenResponse })
  @Post('scans/:id/share')
  async enableShare(@RequestUser() user: AuthUser, @Param('id') id: string) {
    const result = await this.scansService.enableShare(id, user);
    return apiOkResponse(result);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('scans/:id/share')
  async disableShare(@RequestUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    await this.scansService.disableShare(id, user);
  }

  @ZodResponse({ type: SharedScanResponse })
  @Public()
  @Get('public/shared-scans/:token')
  async getSharedScan(@Param('token') token: string) {
    const data = await this.scansService.findByShareToken(token);
    return apiOkResponse(data);
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
