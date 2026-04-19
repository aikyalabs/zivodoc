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
    return apiPaginatedResponse(items, Number(total));
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

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@RequestUser() user: AuthUser, @Param('id') id: string) {
    await this.projectsService.remove(id, user);
  }
}
