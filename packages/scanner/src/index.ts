export type {
  ScanMode,
  FindingSeverity,
  FindingConfidence,
  FindingCategory,
  FindingEvidence,
  ScanOptions,
  ScannedPage,
  CodeBlock,
  PageLink,
  LinkCheckResult,
  CodeCheckResult,
  Finding,
  ScanStep,
  ScanStepName,
  ScanReport,
  ScanReportSection,
  ScanResult,
} from './types.js';

export { crawlSite } from './crawl/site-crawler.js';
export { parseMarkdownFile } from './repo/markdown-parser.js';
export { cloneRepo } from './repo/repo-cloner.js';
export { discoverMarkdownFiles } from './repo/file-discoverer.js';
export { validateCodeBlock, validateCodeBlocks } from './repo/code-validator.js';
export { checkLinks } from './shared/link-checker.js';
export { createFinding } from './shared/finding-builder.js';
export { executeCodeBlocks, analyzeBlockForExecution } from './repo/code-executor.js';
export { analyzeContent } from './analyze/content-analyzer.js';
export {
  fetchAndParseSpec,
  extractSpecEndpoints,
  validateOpenApi,
} from './analyze/openapi-validator.js';
export { generateReport } from './report/report-generator.js';

import type {
  ScanOptions,
  ScanResult,
  Finding,
  PageLink,
  CodeBlock,
  ScannedPage,
  ScanStep,
  ScanStepName,
} from './types.js';
import { crawlSite } from './crawl/site-crawler.js';
import { cloneRepo } from './repo/repo-cloner.js';
import { discoverMarkdownFiles } from './repo/file-discoverer.js';
import { parseMarkdownFile } from './repo/markdown-parser.js';
import { validateCodeBlocks, PARSEABLE_LANGUAGES } from './repo/code-validator.js';
import { executeCodeBlocks } from './repo/code-executor.js';
import { checkLinks } from './shared/link-checker.js';
import {
  syntaxErrorFinding,
  runtimeErrorFinding,
  createFinding,
} from './shared/finding-builder.js';
import { analyzeContent } from './analyze/content-analyzer.js';
import { fetchAndParseSpec, validateOpenApi } from './analyze/openapi-validator.js';
import { generateReport } from './report/report-generator.js';
import { assertPublicUrl } from './shared/url-guard.js';

function createStep(name: ScanStepName, label: string): ScanStep {
  return { name, label, status: 'pending' };
}

function startStep(step: ScanStep): ScanStep {
  return { ...step, status: 'running', startedAt: Date.now() };
}

function completeStep(step: ScanStep, itemsProcessed: number, findingsCount: number): ScanStep {
  const now = Date.now();
  return {
    ...step,
    status: 'completed',
    completedAt: now,
    durationMs: step.startedAt ? now - step.startedAt : 0,
    itemsProcessed,
    findingsCount,
  };
}

async function assertScanTargetsPublic(options: ScanOptions): Promise<void> {
  const targets = [options.siteUrl, options.repoUrl, options.openapiSpecUrl];
  for (const target of targets) {
    if (target) await assertPublicUrl(target);
  }
}

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const maxPages = options.maxPages ?? 100;
  const concurrency = options.concurrency ?? 5;

  if (options.blockPrivateNetworks) await assertScanTargetsPublic(options);

  const steps: ScanStep[] = [
    createStep('crawl', 'Crawl & Extract'),
    createStep('check_links', 'Link Verification'),
    createStep('check_code', 'Code Validation'),
    createStep('check_security', 'Security Scan'),
    createStep('check_structure', 'Structure Analysis'),
    createStep('check_content', 'Content Quality'),
    createStep('check_openapi', 'OpenAPI Spec Validation'),
    createStep('report', 'Report Generation'),
  ];

  const findingsByStep = new Map<ScanStepName, Finding[]>();
  let totalPagesScanned = 0;
  let totalCodeBlocksFound = 0;
  let totalLinksChecked = 0;

  const allPages: ScannedPage[] = [];
  const allLinks: PageLink[] = [];
  const allCodeBlocks: CodeBlock[] = [];

  steps[0] = startStep(steps[0]);
  const crawlFindings: Finding[] = [];

  if (options.mode === 'site' || options.mode === 'both') {
    if (!options.siteUrl) throw new Error('siteUrl is required for site/both scan modes');

    const siteResult = await crawlSite({
      url: options.siteUrl,
      maxPages,
      concurrency,
    });

    crawlFindings.push(...siteResult.findings);
    allPages.push(...siteResult.pages);
    totalPagesScanned += siteResult.pagesScanned;
    totalCodeBlocksFound += siteResult.codeBlocksFound;
    totalLinksChecked += siteResult.linksChecked;
  }

  if (options.mode === 'repo' || options.mode === 'both') {
    if (!options.repoUrl) throw new Error('repoUrl is required for repo/both scan modes');

    const { localPath, cleanup } = await cloneRepo(
      options.repoUrl,
      options.branch,
      options.authToken,
    );

    try {
      const files = await discoverMarkdownFiles(localPath, options.docPaths);
      totalPagesScanned += files.length;

      for (const file of files) {
        try {
          const page = await parseMarkdownFile(file);
          allPages.push(page);
          allLinks.push(...page.links);
          allCodeBlocks.push(...page.codeBlocks);
        } catch (err) {
          crawlFindings.push(
            createFinding({
              category: 'missing_page',
              severity: 'error',
              confidence: 'high',
              source: file,
              line: 0,
              title: `Failed to parse: ${file.split('/').pop()}`,
              description: `Error: ${err instanceof Error ? err.message : String(err)}`,
              evidence: { snippet: file },
            }),
          );
        }
      }

      totalCodeBlocksFound += allCodeBlocks.length;
    } finally {
      await cleanup();
    }
  }

  findingsByStep.set('crawl', crawlFindings);
  steps[0] = completeStep(steps[0], totalPagesScanned, crawlFindings.length);

  steps[1] = startStep(steps[1]);
  const linkFindings: Finding[] = [];

  const externalLinks = allLinks.filter((l) => l.type === 'external');
  totalLinksChecked += externalLinks.length;

  if (externalLinks.length > 0) {
    const { findings } = await checkLinks(allLinks, {
      blockPrivateNetworks: options.blockPrivateNetworks,
    });
    linkFindings.push(...findings);
  }

  findingsByStep.set('check_links', linkFindings);
  steps[1] = completeStep(steps[1], externalLinks.length, linkFindings.length);

  steps[2] = startStep(steps[2]);
  const codeFindings: Finding[] = [];

  if (allCodeBlocks.length > 0) {
    const codeResults = validateCodeBlocks(allCodeBlocks);
    for (const result of codeResults) {
      if (!result.valid) {
        for (const error of result.errors) {
          codeFindings.push(
            syntaxErrorFinding(
              result.block.source,
              result.block.lineStart,
              result.block.language,
              error.message,
              result.block.code,
            ),
          );
        }
      }
    }
  }

  const jsBlocks = allCodeBlocks.filter((b) => {
    const lang = b.language?.toLowerCase();
    return lang != null && PARSEABLE_LANGUAGES.has(lang);
  });

  if (jsBlocks.length > 0) {
    const execResults = await executeCodeBlocks(jsBlocks);
    for (const result of execResults) {
      if (result.error) {
        codeFindings.push(
          runtimeErrorFinding(
            result.block.source,
            result.block.lineStart,
            result.block.language,
            result.error.type,
            result.error.message,
            result.block.code,
          ),
        );
      }
    }
  }

  findingsByStep.set('check_code', codeFindings);
  steps[2] = completeStep(steps[2], allCodeBlocks.length, codeFindings.length);

  steps[3] = startStep(steps[3]);
  steps[4] = startStep(steps[4]);
  steps[5] = startStep(steps[5]);

  const contentFindings = analyzeContent(allPages);

  const securityCats = new Set(['leaked_secret', 'insecure_link', 'internal_url']);
  const structureCats = new Set([
    'missing_page',
    'heading_skip',
    'multiple_h1',
    'empty_section',
    'broken_image',
    'missing_alt_text',
  ]);

  const securityFindings = contentFindings.filter((f) => securityCats.has(f.category));
  const structureFindings = contentFindings.filter((f) => structureCats.has(f.category));
  const qualityFindings = contentFindings.filter(
    (f) => !securityCats.has(f.category) && !structureCats.has(f.category),
  );

  findingsByStep.set('check_security', securityFindings);
  findingsByStep.set('check_structure', structureFindings);
  findingsByStep.set('check_content', qualityFindings);

  steps[3] = completeStep(steps[3], allPages.length, securityFindings.length);
  steps[4] = completeStep(steps[4], allPages.length, structureFindings.length);
  steps[5] = completeStep(steps[5], allPages.length, qualityFindings.length);

  steps[6] = startStep(steps[6]);
  const openapiFindings: Finding[] = [];
  if (options.openapiSpecUrl) {
    try {
      const spec = await fetchAndParseSpec(options.openapiSpecUrl);
      openapiFindings.push(...validateOpenApi(spec, allPages, options.openapiSpecUrl));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      openapiFindings.push(
        createFinding({
          category: 'missing_endpoint',
          severity: 'info',
          confidence: 'low',
          source: options.openapiSpecUrl,
          line: 0,
          title: 'OpenAPI spec could not be loaded',
          description: `Failed to fetch or parse the OpenAPI spec: ${message}`,
          evidence: { snippet: options.openapiSpecUrl, actual: message },
        }),
      );
    }
  }
  findingsByStep.set('check_openapi', openapiFindings);
  steps[6] = completeStep(steps[6], 1, openapiFindings.length);

  const allFindings: Finding[] = [];
  for (const findings of findingsByStep.values()) {
    allFindings.push(...findings);
  }
  const deduped = deduplicateFindings(allFindings);

  steps[7] = startStep(steps[7]);

  const duration = Date.now() - startTime;
  const report = generateReport({
    mode: options.mode,
    url: options.siteUrl ?? options.repoUrl,
    pagesScanned: totalPagesScanned,
    linksChecked: totalLinksChecked,
    codeBlocksFound: totalCodeBlocksFound,
    findings: deduped,
    steps,
    durationMs: duration,
  });

  steps[7] = completeStep(steps[7], 1, 0);

  return {
    mode: options.mode,
    pagesScanned: totalPagesScanned,
    codeBlocksFound: totalCodeBlocksFound,
    linksChecked: totalLinksChecked,
    findings: deduped,
    steps,
    report,
    duration,
    pages: allPages,
  };
}

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
