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
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleResponse,
  RolesResponse,
} from '@src/roles/roles.dto';
import { RolesService } from '@src/roles/roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ZodResponse({ type: RolesResponse })
  @Roles('admin', 'owner')
  @Get()
  async findAll(
    @RequestUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pagination = clampPagination(limit, offset);
    const [items, total] = await this.rolesService.list(user, pagination);
    return apiPaginatedResponse(items, Number(total));
  }

  @ZodResponse({ type: RoleResponse })
  @Roles('admin', 'owner')
  @Get(':id')
  async findOne(@RequestUser() user: AuthUser, @Param('id') id: string) {
    const role = await this.rolesService.findById(id, user);
    return apiOkResponse(role);
  }

  @ZodResponse({ type: CreatedResponse })
  @Roles('admin', 'owner')
  @Post()
  async create(@RequestUser() user: AuthUser, @Body() body: CreateRoleRequest) {
    const created = await this.rolesService.create(body, user);
    return apiCreatedResponse(created.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'owner')
  @Patch(':id')
  async update(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateRoleRequest,
  ) {
    await this.rolesService.update(id, body, user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'owner')
  @Delete(':id')
  async remove(@RequestUser() user: AuthUser, @Param('id') id: string) {
    await this.rolesService.remove(id, user);
  }
}
