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

import { Response } from 'express';
import { Res } from '@nestjs/common';
import {
  apiCreatedResponse,
  apiOkResponse,
  apiPaginatedResponse,
  CreatedResponse,
} from '@src/api-response.helper';
import { FindingCategory, FindingSeverity, FindingStatus } from '@zivodoc/shared';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import { clampPagination } from '@src/pagination.helper';
import {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectResponse,
  ProjectsResponse,
} from '@src/projects/projects.dto';
import { ProjectsService } from '@src/projects/projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ZodResponse({ type: ProjectsResponse })
  @Get()
  async findAll(
    @RequestUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pagination = clampPagination(limit, offset);
    const [items, total] = await this.projectsService.list(user, pagination);

    // Flatten ProjectWithStats into the response shape
    const payload = items.map((item) => ({
      ...item.project,
      lastScanStatus: item.lastScanStatus,
      lastScanDate: item.lastScanDate,
      totalScans: item.totalScans,
      totalFindings: item.totalFindings,
    }));

    return apiPaginatedResponse(payload, Number(total));
  }

  @ZodResponse({ type: ProjectResponse })
  @Get(':id')
  async findOne(@RequestUser() user: AuthUser, @Param('id') id: string) {
    const project = await this.projectsService.findById(id, user);
    return apiOkResponse(project);
  }

  @ZodResponse({ type: CreatedResponse })
  @Post()
  async create(@RequestUser() user: AuthUser, @Body() body: CreateProjectRequest) {
    const created = await this.projectsService.create(body, user);
    return apiCreatedResponse(created.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id')
  async update(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateProjectRequest,
  ) {
    await this.projectsService.update(id, body, user);
  }

  @Get(':id/findings')
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
    const [items, total] = await this.projectsService.getFindings(id, user, {
      category: category as FindingCategory | undefined,
      severity: severity as FindingSeverity | undefined,
      status: status as FindingStatus | undefined,
      ...pagination,
    });
    return apiPaginatedResponse(items, Number(total));
  }

  @Get(':id/findings/export')
  async exportFindings(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const csv = await this.projectsService.exportFindingsCsv(id, user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="findings-${id}.csv"`);
    res.send(csv);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@RequestUser() user: AuthUser, @Param('id') id: string) {
    await this.projectsService.remove(id, user);
  }
}
