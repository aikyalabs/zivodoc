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
import { Roles } from '@src/auth/roles.decorator';
import { clampPagination } from '@src/pagination.helper';
import {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationResponse,
  OrganizationsResponse,
} from '@src/organizations/organizations.dto';
import { OrganizationsService } from '@src/organizations/organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @ZodResponse({ type: OrganizationsResponse })
  @Roles('admin', 'owner')
  @Get()
  async findAll(
    @RequestUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pagination = clampPagination(limit, offset);
    const [items, total] = await this.organizationsService.list(user, pagination);
    return apiPaginatedResponse(items, Number(total));
  }

  @ZodResponse({ type: OrganizationResponse })
  @Get(':id')
  async findOne(@RequestUser() user: AuthUser, @Param('id') id: string) {
    const org = await this.organizationsService.findById(id, user);
    return apiOkResponse(org);
  }

  @ZodResponse({ type: CreatedResponse })
  @Roles('admin')
  @Post()
  async create(@Body() body: CreateOrganizationRequest) {
    const created = await this.organizationsService.create(body);
    return apiCreatedResponse(created.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'owner')
  @Patch(':id')
  async update(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateOrganizationRequest,
  ) {
    await this.organizationsService.update(id, body, user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'owner')
  @Delete(':id')
  async remove(@RequestUser() user: AuthUser, @Param('id') id: string) {
    await this.organizationsService.remove(id);
  }
}
