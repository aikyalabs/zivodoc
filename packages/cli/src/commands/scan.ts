import chalk from 'chalk';
import ora from 'ora';
import { getApiKey, getApiUrl } from '../config.js';
import type { ScanResult, Finding } from '@zivodoc/scanner';

interface ScanCommandOptions {
  url?: string;
  repo?: string;
  branch?: string;
  docPaths?: string[];
  maxPages?: number;
  mode?: 'site' | 'repo' | 'both';
  json?: boolean;
  project?: string;
}

export async function scanCommand(options: ScanCommandOptions): Promise<void> {
  if (!options.url && !options.repo) {
    console.error(chalk.red('Error: Provide --url or --repo'));
    process.exit(1);
  }

  const mode = options.mode ?? (options.url ? 'site' : 'repo');
  const spinner = ora('Starting scan...').start();

  try {
    // Suppress Crawlee's verbose logging in CLI output
    process.env.CRAWLEE_LOG_LEVEL = 'ERROR';

    const { scan } = await import('@zivodoc/scanner');

    spinner.text = 'Crawling pages...';

    const result: ScanResult = await scan({
      mode,
      siteUrl: options.url,
      repoUrl: options.repo,
      branch: options.branch,
      docPaths: options.docPaths,
      maxPages: options.maxPages ?? 500,
      concurrency: 5,
    });

    spinner.stop();

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      printResults(result);
    }

    if (options.project) {
      await uploadResults(options.project, result);
    }

    const errorCount = result.findings.filter((f) => f.severity === 'error').length;
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (err) {
    spinner.fail('Scan failed');
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
    process.exit(2);
  }
}

function printResults(result: ScanResult): void {
  console.log('');
  console.log(chalk.bold('Scan Results'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log(`  Pages scanned:  ${chalk.bold(String(result.pagesScanned))}`);
  console.log(`  Links checked:  ${chalk.bold(String(result.linksChecked))}`);
  console.log(`  Code blocks:    ${chalk.bold(String(result.codeBlocksFound))}`);
  console.log(`  Duration:       ${chalk.bold(formatDuration(result.duration))}`);
  console.log('');

  const errors = result.findings.filter((f) => f.severity === 'error');
  const warnings = result.findings.filter((f) => f.severity === 'warning');
  const infos = result.findings.filter((f) => f.severity === 'info');

  if (result.findings.length === 0) {
    console.log(chalk.green('  ✓ No issues found'));
    console.log('');
    return;
  }

  console.log(chalk.bold('Findings'));
  console.log(
    `  ${chalk.red(`${errors.length} errors`)}  ${chalk.yellow(`${warnings.length} warnings`)}  ${chalk.blue(`${infos.length} info`)}`,
  );
  console.log('');

  for (const finding of result.findings) {
    printFinding(finding);
  }

  if (errors.length > 0) {
    console.log('');
    console.log(
      chalk.red(`✗ ${errors.length} error${errors.length > 1 ? 's' : ''} found — exit code 1`),
    );
  }
}

function printFinding(finding: Finding): void {
  const icon =
    finding.severity === 'error'
      ? chalk.red('✗')
      : finding.severity === 'warning'
        ? chalk.yellow('⚠')
        : chalk.blue('ℹ');

  const confidence = finding.confidence !== 'high' ? chalk.dim(` [${finding.confidence}]`) : '';

  console.log(`  ${icon} ${finding.title}${confidence}`);
  console.log(chalk.dim(`    ${finding.source}${finding.line > 0 ? `:${finding.line}` : ''}`));

  if (finding.suggestion) {
    console.log(chalk.dim(`    → ${finding.suggestion}`));
  }
  console.log('');
}

async function uploadResults(projectId: string, result: ScanResult): Promise<void> {
  const apiKey = getApiKey();
  const apiUrl = getApiUrl();

  if (!apiKey) {
    console.log(chalk.yellow('⚠ No API key found — run `zivodoc login <key>` to upload results'));
    return;
  }

  const spinner = ora('Uploading results to zivodoc...').start();

  try {
    const response = await fetch(`${apiUrl}/projects/${projectId}/scans/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        pagesScanned: result.pagesScanned,
        codeBlocksFound: result.codeBlocksFound,
        linksChecked: result.linksChecked,
        duration: result.duration,
        triggerSource: 'cli',
        findings: result.findings.map((f) => ({
          category: f.category,
          severity: f.severity,
          confidence: f.confidence,
          source: f.source,
          line: f.line,
          title: f.title,
          description: f.description,
          suggestion: f.suggestion,
          evidence: f.evidence,
        })),
      }),
    });

    if (response.ok) {
      spinner.succeed('Results uploaded to zivodoc dashboard');
    } else {
      const body = await response.json().catch(() => ({}));
      spinner.fail(
        `Upload failed: ${(body as { message?: string }).message ?? response.statusText}`,
      );
    }
  } catch (err) {
    spinner.fail(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}
