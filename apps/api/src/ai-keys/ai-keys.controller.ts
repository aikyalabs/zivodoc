import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';

import { apiOkResponse } from '@src/api-response.helper';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import type { AiProvider } from '@zivodoc/shared';

import { UpsertAiProviderKeyRequest } from './ai-keys.dto';
import { AiKeysService } from './ai-keys.service';

@Controller('ai-keys')
export class AiKeysController {
  constructor(private readonly service: AiKeysService) {}

  @Get()
  async list(@RequestUser() user: AuthUser) {
    const keys = await this.service.list(user);
    return apiOkResponse(
      keys.map((k) => ({
        id: k.id,
        organizationId: k.organizationId,
        provider: k.provider,
        model: k.model,
        keyPreview: k.keyPreview,
        lastUsedAt: k.lastUsedAt,
        lastVerifiedAt: k.lastVerifiedAt,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      })),
    );
  }

  @Put()
  async upsert(@RequestUser() user: AuthUser, @Body() body: UpsertAiProviderKeyRequest) {
    const saved = await this.service.upsert(user, body);
    return apiOkResponse({
      id: saved.id,
      organizationId: saved.organizationId,
      provider: saved.provider,
      model: saved.model,
      keyPreview: saved.keyPreview,
      lastUsedAt: saved.lastUsedAt,
      lastVerifiedAt: saved.lastVerifiedAt,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':provider')
  async remove(@RequestUser() user: AuthUser, @Param('provider') provider: AiProvider) {
    await this.service.remove(user, provider);
  }
}
