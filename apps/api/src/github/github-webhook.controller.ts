import { Controller, Post, Req, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';

import { Public } from '@src/auth/public.decorator';
import { GitHubAppService } from './github-app.service';
import { GitHubWebhookService } from './github-webhook.service';

@Controller('github')
export class GitHubWebhookController {
  constructor(
    private readonly githubApp: GitHubAppService,
    private readonly webhookService: GitHubWebhookService,
  ) {}

  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @Post('webhooks')
  async handleWebhook(@Req() req: Request) {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const event = req.headers['x-github-event'] as string | undefined;

    if (!signature || !event) {
      throw new BadRequestException('Missing GitHub webhook headers.');
    }

    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body for signature verification.');
    }

    if (!this.githubApp.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    const payload = req.body;
    await this.webhookService.handleEvent(event, payload);

    return { ok: true };
  }
}
