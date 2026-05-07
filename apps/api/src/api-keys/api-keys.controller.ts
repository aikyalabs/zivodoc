import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { apiCreatedResponse, apiOkResponse } from '@src/api-response.helper';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async generate(@RequestUser() user: AuthUser, @Body() body: { name: string }) {
    const { key, entity } = await this.apiKeysService.generate(body.name, user);
    return apiOkResponse({
      id: entity.id,
      name: entity.name,
      prefix: entity.prefix,
      key,
      createdAt: entity.createdAt,
    });
  }

  @Get()
  async list(@RequestUser() user: AuthUser) {
    const keys = await this.apiKeysService.list(user);
    return apiOkResponse(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
        isActive: k.isActive,
      })),
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async revoke(@RequestUser() user: AuthUser, @Param('id') id: string) {
    await this.apiKeysService.revoke(id, user);
  }
}
