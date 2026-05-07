import { Controller, Delete, Get, Logger, Param, Post, Body, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { apiOkResponse } from '@src/api-response.helper';
import { AuthUser, RequestUser } from '@src/auth/request-user.decorator';
import { Public } from '@src/auth/public.decorator';
import { AppConfig } from '@src/config.module';
import { GitHubAppService } from './github-app.service';
import { GitHubInstallationService } from './github-installation.service';

@Controller('github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly githubApp: GitHubAppService,
    private readonly installationService: GitHubInstallationService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Get('install-url')
  getInstallUrl(@RequestUser() user: AuthUser) {
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        organizationId: user.organizationId,
      }),
    ).toString('base64url');
    return apiOkResponse({ url: this.githubApp.getInstallUrl(state) });
  }

  @Public()
  @Get('callback')
  async handleCallback(
    @Query('installation_id') installationId: string,
    @Query('setup_action') setupAction: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL');

    try {
      if (setupAction === 'install' || setupAction === 'update') {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
        const caller = {
          id: decoded.userId,
          organizationId: decoded.organizationId,
          role: 'owner' as const,
        };
        const numericId = parseInt(installationId, 10);

        const appOctokit = await this.githubApp.getAppOctokit();
        const { data: installation } = await appOctokit.apps.getInstallation({
          installation_id: numericId,
        });

        await this.installationService.handleInstallationCreated(
          numericId,
          {
            login: (installation.account as { login: string }).login,
            type: (installation.account as { type: string }).type,
            avatar_url: (installation.account as { avatar_url?: string }).avatar_url,
          },
          installation.permissions,
          installation.repository_selection ?? 'selected',
          caller,
        );
      }

      res.redirect(`${frontendUrl}/settings/github?status=success`);
    } catch (err) {
      this.logger.error(`GitHub callback failed: ${err instanceof Error ? err.message : err}`);
      res.redirect(`${frontendUrl}/settings/github?status=error`);
    }
  }

  @Get('installations')
  async listInstallations(@RequestUser() user: AuthUser) {
    const installations = await this.installationService.listInstallations(user);
    return apiOkResponse(
      installations.map((i) => ({
        id: i.id,
        installationId: i.installationId,
        accountLogin: i.accountLogin,
        accountType: i.accountType,
        accountAvatarUrl: i.accountAvatarUrl,
        repositorySelection: i.repositorySelection,
        createdAt: i.createdAt,
      })),
    );
  }

  @Get('installations/:installationId/repos')
  async listRepos(@RequestUser() user: AuthUser, @Param('installationId') installationId: string) {
    const repos = await this.installationService.listRepos(parseInt(installationId, 10), user);
    return apiOkResponse(repos);
  }

  @Post('link')
  async linkRepo(
    @RequestUser() user: AuthUser,
    @Body()
    body: {
      installationId: number;
      repoId: number;
      repoFullName: string;
      repoDefaultBranch?: string;
      repoPrivate?: boolean;
      repoCloneUrl?: string;
      projectId?: string;
    },
  ) {
    const link = await this.installationService.linkRepoToProject(body, user);
    return apiOkResponse({
      id: link.id,
      projectId: link.projectId,
      repoFullName: link.repoFullName,
    });
  }

  @Delete('link/:projectId')
  async unlinkRepo(@RequestUser() user: AuthUser, @Param('projectId') projectId: string) {
    await this.installationService.unlinkRepo(projectId, user);
    return apiOkResponse(null);
  }
}
