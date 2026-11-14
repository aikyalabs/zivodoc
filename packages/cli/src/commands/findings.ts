import chalk from 'chalk';
import { getApiKey, getApiUrl } from '../config.js';

interface FindingResponse {
  id: string;
  category: string;
  severity: string;
  title: string;
  source: string;
  line: number;
  status: string;
}

export async function findingsCommand(
  projectId: string,
  options: { status?: string; severity?: string; limit?: number },
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error(chalk.red('Not authenticated. Run: zivodoc login <api-key>'));
    process.exit(1);
  }

  const apiUrl = getApiUrl();
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  if (options.severity) params.set('severity', options.severity);
  if (options.limit) params.set('limit', String(options.limit));

  try {
    const response = await fetch(`${apiUrl}/projects/${projectId}/findings?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(chalk.red(`API error (${response.status}): ${body}`));
      process.exit(1);
    }

    const data = (await response.json()) as { payload: FindingResponse[]; meta: { total: number } };
    const findings = data.payload;

    console.log('');
    console.log(chalk.bold(`${data.meta.total} findings for project ${projectId}`));
    console.log('');

    for (const f of findings) {
      const icon =
        f.severity === 'error'
          ? chalk.red('✗')
          : f.severity === 'warning'
            ? chalk.yellow('⚠')
            : chalk.blue('ℹ');

      const statusBadge =
        f.status === 'open'
          ? ''
          : f.status === 'reopened'
            ? chalk.red(' [REGRESSION]')
            : f.status === 'resolved'
              ? chalk.green(' [RESOLVED]')
              : f.status === 'ignored'
                ? chalk.dim(' [IGNORED]')
                : f.status === 'auto_resolved'
                  ? chalk.green(' [FIXED]')
                  : '';

      console.log(`  ${icon} ${f.title}${statusBadge}`);
      console.log(chalk.dim(`    ${f.source}${f.line > 0 ? `:${f.line}` : ''} · ${f.category}`));
      console.log('');
    }
  } catch (err) {
    console.error(
      chalk.red(`Failed to fetch findings: ${err instanceof Error ? err.message : String(err)}`),
    );
    process.exit(1);
  }
}
