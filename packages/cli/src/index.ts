import { Command, InvalidArgumentError, Option } from 'commander';
import { loginCommand } from './commands/login.js';
import { scanCommand } from './commands/scan.js';
import { findingsCommand } from './commands/findings.js';

const program = new Command();

function parsePositiveInteger(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new InvalidArgumentError('Must be a positive integer.');
  }
  return parsed;
}

program.name('zivodoc').description('Automated QA for developer documentation').version('0.1.0');

program
  .command('login <api-key>')
  .description('Save API key for authenticating with the zivodoc API')
  .option('--url <url>', 'API URL (default: https://api.zivodoc.com)')
  .action(loginCommand);

program
  .command('scan')
  .description('Scan docs for broken links, code errors, and content issues')
  .option('--url <url>', 'Docs site URL to crawl')
  .option('--repo <url>', 'Git repository URL to scan')
  .option('--branch <branch>', 'Branch to scan (default: main)')
  .option('--doc-paths <paths...>', 'Paths to scan within the repo')
  .option('--max-pages <n>', 'Max pages to crawl', parsePositiveInteger, 500)
  .addOption(
    new Option(
      '--mode <mode>',
      'Scan mode (default: site when --url is given, otherwise repo)',
    ).choices(['site', 'repo', 'both']),
  )
  .option('--json', 'Output results as JSON')
  .option('--project <id>', 'Upload results to a zivodoc project')
  .action((opts) =>
    scanCommand({
      url: opts.url,
      repo: opts.repo,
      branch: opts.branch,
      docPaths: opts.docPaths,
      maxPages: opts.maxPages,
      mode: opts.mode,
      json: opts.json,
      project: opts.project,
    }),
  );

program
  .command('findings <project-id>')
  .description('List findings for a project from the API')
  .option('--status <status>', 'Filter by status (open, resolved, ignored)')
  .option('--severity <severity>', 'Filter by severity (error, warning, info)')
  .option('--limit <n>', 'Max results', parsePositiveInteger, 25)
  .action(findingsCommand);

program.parse();
