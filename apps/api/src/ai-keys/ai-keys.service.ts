import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AiProviderKeyRepository } from '@db/repositories';
import { AiProviderKeyEntity, type AiProvider } from '@db/entities';
import type { AppConfig } from '@src/config.module';
import type { Caller } from '@src/auth/request-user.decorator';

import { decrypt, encrypt, previewKey } from './encryption.util';

const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4.1-mini',
};

@Injectable()
export class AiKeysService {
  private readonly logger = new Logger(AiKeysService.name);

  constructor(
    private readonly repo: AiProviderKeyRepository,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private encryptionKey(): string {
    return this.config.get('ENCRYPTION_KEY');
  }

  private requireOrg(caller: Caller): string {
    if (!caller.organizationId) {
      throw new ForbiddenException('No organization context.');
    }
    return caller.organizationId;
  }

  async list(caller: Caller): Promise<AiProviderKeyEntity[]> {
    const orgId = this.requireOrg(caller);
    return this.repo.listByOrg(orgId);
  }

  async upsert(
    caller: Caller,
    input: { provider: AiProvider; apiKey: string; model?: string },
  ): Promise<AiProviderKeyEntity> {
    const orgId = this.requireOrg(caller);
    const trimmed = input.apiKey.trim();
    if (trimmed.length < 10) throw new BadRequestException('API key looks invalid.');

    await this.verifyKey(input.provider, trimmed);

    const existing = await this.repo.findByOrgAndProvider(orgId, input.provider);
    const encrypted = encrypt(trimmed, this.encryptionKey());
    const preview = previewKey(trimmed);
    const model = input.model ?? existing?.model ?? DEFAULT_MODELS[input.provider];
    const now = new Date();

    if (existing) {
      existing.encryptedKey = encrypted;
      existing.keyPreview = preview;
      existing.model = model;
      existing.lastVerifiedAt = now;
      existing.createdByUserId = caller.id;
      return this.repo.save(existing);
    }

    const created = this.repo.create({
      organizationId: orgId,
      provider: input.provider,
      model,
      encryptedKey: encrypted,
      keyPreview: preview,
      lastVerifiedAt: now,
      createdByUserId: caller.id,
    });
    return this.repo.save(created);
  }

  async remove(caller: Caller, provider: AiProvider): Promise<void> {
    const orgId = this.requireOrg(caller);
    const found = await this.repo.findByOrgAndProvider(orgId, provider);
    if (!found) throw new NotFoundException('No key set for this provider.');
    await this.repo.remove(found);
  }

  async getDecryptedKey(
    organizationId: string,
    provider: AiProvider,
  ): Promise<{ apiKey: string; model: string } | null> {
    const found = await this.repo.findByOrgAndProvider(organizationId, provider);
    if (!found) return null;
    try {
      const apiKey = decrypt(found.encryptedKey, this.encryptionKey());
      void this.repo.update(found.id, { lastUsedAt: new Date() }).catch((err) => {
        this.logger.warn(`Failed to update lastUsedAt for ${found.id}: ${err}`);
      });
      return { apiKey, model: found.model };
    } catch (err) {
      this.logger.error(
        `Failed to decrypt AI key ${found.id} — ENCRYPTION_KEY may have rotated`,
        err,
      );
      return null;
    }
  }

  private async verifyKey(provider: AiProvider, apiKey: string): Promise<void> {
    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new BadRequestException(
          `Anthropic rejected the key (HTTP ${res.status}). Double-check it and try again.`,
        );
      }
      return;
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        throw new BadRequestException(
          `OpenAI rejected the key (HTTP ${res.status}). Double-check it and try again.`,
        );
      }
      return;
    }

    throw new BadRequestException(`Unsupported provider: ${provider as string}`);
  }
}
