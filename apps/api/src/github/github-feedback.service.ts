import { Injectable, Logger } from '@nestjs/common';

import { GitHubAppService } from './github-app.service';

interface ScanFeedbackParams {
  installationId: number;
  repoFullName: string;
  commitSha: string;
  prNumber?: number;
  checkRunsEnabled: boolean;
  prCommentsEnabled: boolean;
  findings: Array<{
    category: string;
    severity: string;
    title: string;
    source: string;
    line: number;
  }>;
  stats: {
    pagesScanned: number;
    linksChecked: number;
    findingsCount: number;
    duration: number;
  };
}

@Injectable()
export class GitHubFeedbackService {
  private readonly logger = new Logger(GitHubFeedbackService.name);

  constructor(private readonly githubApp: GitHubAppService) {}

  async postResults(params: ScanFeedbackParams): Promise<void> {
    const [owner, repo] = params.repoFullName.split('/');
    if (!owner || !repo) return;

    if (params.checkRunsEnabled) {
      await this.postCheckRun(params, owner, repo);
    }

    if (params.prCommentsEnabled && params.prNumber) {
      await this.postPrComment(params, owner, repo);
    }
  }

  private async postCheckRun(
    params: ScanFeedbackParams,
    owner: string,
    repo: string,
  ): Promise<void> {
    const errors = params.findings.filter((f) => f.severity === 'error');
    const warnings = params.findings.filter((f) => f.severity === 'warning');

    const conclusion: 'success' | 'failure' | 'neutral' =
      errors.length > 0 ? 'failure' : warnings.length > 0 ? 'neutral' : 'success';

    const summary = [
      `**${params.stats.findingsCount}** findings across **${params.stats.pagesScanned}** pages`,
      `- ${errors.length} errors`,
      `- ${warnings.length} warnings`,
      `- ${params.findings.length - errors.length - warnings.length} info`,
      '',
      `Completed in ${(params.stats.duration / 1000).toFixed(1)}s`,
    ].join('\n');

    const title =
      errors.length > 0
        ? `${errors.length} error${errors.length > 1 ? 's' : ''} found`
        : warnings.length > 0
          ? `${warnings.length} warning${warnings.length > 1 ? 's' : ''} found`
          : 'All checks passed';

    const text =
      params.findings.length > 0
        ? this.buildFindingsMarkdown(params.findings.slice(0, 50))
        : undefined;

    await this.githubApp.createCheckRun({
      installationId: params.installationId,
      owner,
      repo,
      headSha: params.commitSha,
      conclusion,
      title,
      summary,
      text,
    });
  }

  private async postPrComment(
    params: ScanFeedbackParams,
    owner: string,
    repo: string,
  ): Promise<void> {
    const errors = params.findings.filter((f) => f.severity === 'error');
    const warnings = params.findings.filter((f) => f.severity === 'warning');

    const lines = [
      '## 📋 zivodoc Docs QA',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Pages scanned | ${params.stats.pagesScanned} |`,
      `| Links checked | ${params.stats.linksChecked} |`,
      `| Errors | ${errors.length} |`,
      `| Warnings | ${warnings.length} |`,
      `| Duration | ${(params.stats.duration / 1000).toFixed(1)}s |`,
    ];

    if (params.findings.length > 0) {
      lines.push('', '### Top Findings', '');
      lines.push('| Severity | Category | Title | Source |');
      lines.push('|----------|----------|-------|--------|');
      for (const f of params.findings.slice(0, 20)) {
        const icon = f.severity === 'error' ? '🔴' : f.severity === 'warning' ? '🟡' : 'ℹ️';
        const source = f.source.length > 50 ? `...${f.source.slice(-47)}` : f.source;
        lines.push(
          `| ${icon} ${f.severity} | ${f.category} | ${f.title.slice(0, 60)} | ${source} |`,
        );
      }
      if (params.findings.length > 20) {
        lines.push('', `_...and ${params.findings.length - 20} more findings_`);
      }
    } else {
      lines.push('', '✅ No issues found — your docs look great!');
    }

    await this.githubApp.createOrUpdatePrComment({
      installationId: params.installationId,
      owner,
      repo,
      prNumber: params.prNumber!,
      body: lines.join('\n'),
    });
  }

  private buildFindingsMarkdown(findings: ScanFeedbackParams['findings']): string {
    const lines = ['### Findings', ''];
    for (const f of findings) {
      const icon = f.severity === 'error' ? '❌' : f.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${icon} **${f.title}**`);
      lines.push(`  - ${f.category} at \`${f.source}\`${f.line > 0 ? `:${f.line}` : ''}`);
      lines.push('');
    }
    return lines.join('\n');
  }
}
