import crypto from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';

import { AppConfig } from '@src/config.module';

const TOKEN_CACHE_PREFIX = 'github:token:';
const TOKEN_CACHE_TTL = 55 * 60;

interface CheckRunParams {
  installationId: number;
  owner: string;
  repo: string;
  headSha: string;
  conclusion: 'success' | 'failure' | 'neutral';
  title: string;
  summary: string;
  text?: string;
}

interface PrCommentParams {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
}

@Injectable()
export class GitHubAppService {
  private readonly logger = new Logger(GitHubAppService.name);
  private readonly redis: Redis;
  private readonly appId: string;
  private readonly privateKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    this.redis = new Redis(config.get('REDIS_URL'));
    this.appId = config.get('GITHUB_APP_ID');
    this.privateKey = this.decodePrivateKey(config.get('GITHUB_APP_PRIVATE_KEY'));
    this.webhookSecret = config.get('GITHUB_APP_WEBHOOK_SECRET');
  }

  get isConfigured(): boolean {
    return this.appId !== '' && this.privateKey !== '';
  }

  async getAppOctokit(): Promise<Octokit> {
    const auth = createAppAuth({
      appId: this.appId,
      privateKey: this.privateKey,
    });
    const { token } = await auth({ type: 'app' });
    return new Octokit({ auth: token });
  }

  async getInstallationToken(installationId: number): Promise<string> {
    const cacheKey = `${TOKEN_CACHE_PREFIX}${installationId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const auth = createAppAuth({
      appId: this.appId,
      privateKey: this.privateKey,
    });
    const { token } = await auth({ type: 'installation', installationId });

    await this.redis.set(cacheKey, token, 'EX', TOKEN_CACHE_TTL);
    return token;
  }

  async getInstallationOctokit(installationId: number): Promise<Octokit> {
    const token = await this.getInstallationToken(installationId);
    return new Octokit({ auth: token });
  }

  async listInstallationRepos(installationId: number): Promise<GitHubRepo[]> {
    const octokit = await this.getInstallationOctokit(installationId);
    const { data } = await octokit.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    return data.repositories.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      defaultBranch: r.default_branch,
      description: r.description ?? null,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url ?? `https://github.com/${r.full_name}.git`,
    }));
  }

  async createCheckRun(params: CheckRunParams): Promise<void> {
    try {
      const octokit = await this.getInstallationOctokit(params.installationId);
      await octokit.checks.create({
        owner: params.owner,
        repo: params.repo,
        name: 'zivodoc Docs QA',
        head_sha: params.headSha,
        status: 'completed',
        conclusion: params.conclusion,
        output: {
          title: params.title,
          summary: params.summary,
          text: params.text,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to create check run: ${err instanceof Error ? err.message : err}`);
    }
  }

  async createOrUpdatePrComment(params: PrCommentParams): Promise<void> {
    const marker = '<!-- zivodoc-scan -->';
    try {
      const octokit = await this.getInstallationOctokit(params.installationId);
      const { data: comments } = await octokit.issues.listComments({
        owner: params.owner,
        repo: params.repo,
        issue_number: params.prNumber,
        per_page: 100,
      });

      const existing = comments.find((c) => c.body?.includes(marker));
      const body = `${marker}\n${params.body}`;

      if (existing) {
        await octokit.issues.updateComment({
          owner: params.owner,
          repo: params.repo,
          comment_id: existing.id,
          body,
        });
      } else {
        await octokit.issues.createComment({
          owner: params.owner,
          repo: params.repo,
          issue_number: params.prNumber,
          body,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to post PR comment: ${err instanceof Error ? err.message : err}`);
    }
  }

  verifyWebhookSignature(payload: Buffer | string, signature: string): boolean {
    const expected = `sha256=${crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  getInstallUrl(state: string): string {
    return `https://github.com/apps/zivodoc/installations/new?state=${encodeURIComponent(state)}`;
  }

  private decodePrivateKey(raw: string): string {
    if (!raw) return '';
    if (raw.startsWith('-----BEGIN')) return raw;
    return Buffer.from(raw, 'base64').toString('utf-8');
  }
}
