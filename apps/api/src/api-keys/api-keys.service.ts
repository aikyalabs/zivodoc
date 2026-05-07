import crypto from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';

import { ApiKeyRepository } from '@db/repositories';
import { ApiKeyEntity } from '@db/entities';
import { Caller, isAdmin } from '@src/auth/request-user.decorator';

const API_KEY_PREFIX = 'zv_';
const KEY_LENGTH = 40;

@Injectable()
export class ApiKeysService {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async generate(name: string, caller: Caller): Promise<{ key: string; entity: ApiKeyEntity }> {
    const rawKey = `${API_KEY_PREFIX}${crypto.randomBytes(KEY_LENGTH).toString('base64url')}`;
    const hashedKey = this.hashKey(rawKey);
    const prefix = rawKey.slice(0, 8);

    const entity = this.apiKeyRepository.create({
      name,
      hashedKey,
      prefix,
      userId: caller.id,
      organizationId: caller.organizationId,
    });

    const saved = await this.apiKeyRepository.save(entity);
    return { key: rawKey, entity: saved };
  }

  async list(caller: Caller): Promise<ApiKeyEntity[]> {
    return this.apiKeyRepository.findByUserId(caller.id);
  }

  async revoke(id: string, caller: Caller): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    if (!apiKey) throw new NotFoundException('API key not found.');
    if (!isAdmin(caller) && apiKey.userId !== caller.id) {
      throw new NotFoundException('API key not found.');
    }

    await this.apiKeyRepository.update(id, { isActive: false });
  }

  async validateKey(rawKey: string): Promise<ApiKeyEntity | null> {
    const hashedKey = this.hashKey(rawKey);
    const apiKey = await this.apiKeyRepository.findByHashedKey(hashedKey);
    if (!apiKey || !apiKey.isActive) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    this.apiKeyRepository.update(apiKey.id, { lastUsedAt: new Date() }).catch(() => {});
    return apiKey;
  }

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }
}
