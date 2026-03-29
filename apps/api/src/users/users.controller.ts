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

import { apiCreatedResponse, apiOkResponse, apiPaginatedResponse } from '@src/api-response.helper';
import { CreatedResponse } from '@src/api-response.helper';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import { Roles } from '@src/auth/roles.decorator';
import { clampPagination } from '@src/pagination.helper';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  UsersResponse,
} from '@src/users/users.dto';
import { UsersService } from '@src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ZodResponse({ type: UsersResponse })
  @Roles('admin', 'owner')
  @Get()
  async findAll(
    @RequestUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const pagination = clampPagination(limit, offset);
    const [items, total] = await this.usersService.list(user, pagination);
    return apiPaginatedResponse(items, Number(total));
  }

  @ZodResponse({ type: UserResponse })
  @Get(':id')
  async findOne(@RequestUser() user: AuthUser, @Param('id') id: string) {
    const found = await this.usersService.findById(id, user);
    return apiOkResponse(found);
  }

  @ZodResponse({ type: CreatedResponse })
  @Roles('admin', 'owner')
  @Post()
  async create(@RequestUser() user: AuthUser, @Body() body: CreateUserRequest) {
    const created = await this.usersService.create(body, user);
    return apiCreatedResponse(created.id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch(':id')
  async update(
    @RequestUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateUserRequest,
  ) {
    await this.usersService.update(id, body, user);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'owner')
  @Delete(':id')
  async remove(@RequestUser() user: AuthUser, @Param('id') id: string) {
    await this.usersService.remove(id, user);
  }
}
