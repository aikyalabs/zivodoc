import { Module } from '@nestjs/common';

import { QueueModule } from '@src/queue/queue.module';
import { GitHubAppService } from './github-app.service';
import { GitHubInstallationService } from './github-installation.service';
import { GitHubController } from './github.controller';
import { GitHubWebhookController } from './github-webhook.controller';
import { GitHubWebhookService } from './github-webhook.service';
import { GitHubFeedbackService } from './github-feedback.service';

@Module({
  imports: [QueueModule],
  controllers: [GitHubController, GitHubWebhookController],
  providers: [
    GitHubAppService,
    GitHubInstallationService,
    GitHubWebhookService,
    GitHubFeedbackService,
  ],
  exports: [GitHubAppService, GitHubInstallationService, GitHubFeedbackService],
})
export class GitHubModule {}
