export type {
  ScanMode,
  FindingSeverity,
  FindingCategory,
  ScanOptions,
  ScannedPage,
  CodeBlock,
  PageLink,
  LinkCheckResult,
  CodeCheckResult,
  Finding,
  ScanResult,
} from './types.js';

export { crawlSite } from './crawl/site-crawler.js';
export { parseMarkdownFile } from './repo/markdown-parser.js';
export { cloneRepo } from './repo/repo-cloner.js';
export { discoverMarkdownFiles } from './repo/file-discoverer.js';
export { validateCodeBlock, validateCodeBlocks } from './repo/code-validator.js';
export { checkLinks } from './shared/link-checker.js';
export { createFinding } from './shared/finding-builder.js';
export { analyzeContent } from './analyze/content-analyzer.js';

import type {
  ScanOptions,
  ScanResult,
  Finding,
  PageLink,
  CodeBlock,
  ScannedPage,
} from './types.js';
import { crawlSite } from './crawl/site-crawler.js';
import { cloneRepo } from './repo/repo-cloner.js';
import { discoverMarkdownFiles } from './repo/file-discoverer.js';
import { parseMarkdownFile } from './repo/markdown-parser.js';
import { validateCodeBlocks } from './repo/code-validator.js';
import { checkLinks } from './shared/link-checker.js';
import { syntaxErrorFinding } from './shared/finding-builder.js';
import { analyzeContent } from './analyze/content-analyzer.js';

/**
 * Run a documentation scan based on the provided options.
 *
 * Supports three modes:
 * - 'site': Crawl a live docs URL
 * - 'repo': Clone a repo and parse markdown files
 * - 'both': Run both site crawl and repo scan, merge results
 */
export async function scan(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const maxPages = options.maxPages ?? 100;
  const concurrency = options.concurrency ?? 5;

  const allFindings: Finding[] = [];
  let totalPagesScanned = 0;
  let totalCodeBlocksFound = 0;
  let totalLinksChecked = 0;

  // Site crawl mode
  if (options.mode === 'site' || options.mode === 'both') {
    if (!options.siteUrl) {
      throw new Error('siteUrl is required for site/both scan modes');
    }

    const siteResult = await crawlSite({
      url: options.siteUrl,
      maxPages,
      concurrency,
    });

    allFindings.push(...siteResult.findings);
    totalPagesScanned += siteResult.pagesScanned;
    totalCodeBlocksFound += siteResult.codeBlocksFound;
    totalLinksChecked += siteResult.linksChecked;
  }

  // Repo scan mode
  if (options.mode === 'repo' || options.mode === 'both') {
    if (!options.repoUrl) {
      throw new Error('repoUrl is required for repo/both scan modes');
    }

    const { localPath, cleanup } = await cloneRepo(options.repoUrl, options.branch);

    try {
      const files = await discoverMarkdownFiles(localPath, options.docPaths);
      totalPagesScanned += files.length;

      const allLinks: PageLink[] = [];
      const allCodeBlocks: CodeBlock[] = [];
      const scannedPages: ScannedPage[] = [];

      // Parse all markdown files
      for (const file of files) {
        try {
          const page = await parseMarkdownFile(file);
          scannedPages.push(page);
          allLinks.push(...page.links);
          allCodeBlocks.push(...page.codeBlocks);
        } catch (err) {
          allFindings.push({
            category: 'missing_page',
            severity: 'error',
            source: file,
            line: 0,
            title: `Failed to parse file: ${file}`,
            description: `Error parsing markdown: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
      }

      totalCodeBlocksFound += allCodeBlocks.length;

      // Validate code blocks
      const codeResults = validateCodeBlocks(allCodeBlocks);
      for (const result of codeResults) {
        if (!result.valid) {
          for (const error of result.errors) {
            allFindings.push(
              syntaxErrorFinding(
                result.block.source,
                result.block.lineStart,
                result.block.language,
                error.message,
                error.line,
                error.column,
              ),
            );
          }
        }
      }

      // Check external links
      const externalLinks = allLinks.filter((l) => l.type === 'external');
      totalLinksChecked += externalLinks.length;

      if (externalLinks.length > 0) {
        const { findings: linkFindings } = await checkLinks(allLinks);
        allFindings.push(...linkFindings);
      }

      // Run content quality analysis
      const contentFindings = analyzeContent(scannedPages);
      allFindings.push(...contentFindings);
    } finally {
      await cleanup();
    }
  }

  // Deduplicate findings by a composite key
  const deduped = deduplicateFindings(allFindings);

  const duration = Date.now() - startTime;

  return {
    mode: options.mode,
    pagesScanned: totalPagesScanned,
    codeBlocksFound: totalCodeBlocksFound,
    linksChecked: totalLinksChecked,
    findings: deduped,
    duration,
  };
}

/**
 * Deduplicate findings based on category + source + line + title.
 */
function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const result: Finding[] = [];

  for (const finding of findings) {
    const key = `${finding.category}|${finding.source}|${finding.line}|${finding.title}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(finding);
    }
  }

  return result;
}
