import { CheerioCrawler, PlaywrightCrawler, Configuration } from 'crawlee';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { ScannedPage, Finding, PageLink, CodeBlock } from '../types.js';
import { extractFromPage, extractTitle, extractTextLength } from './page-extractor.js';
import { createFinding, brokenAnchorFinding } from '../shared/finding-builder.js';

const MIN_TEXT_LENGTH = 100;

interface CrawlSiteOptions {
  url: string;
  maxPages: number;
  concurrency: number;
}

export interface CrawlSiteResult {
  pages: ScannedPage[];
  findings: Finding[];
  pagesScanned: number;
  codeBlocksFound: number;
  linksChecked: number;
}

export async function crawlSite(options: CrawlSiteOptions): Promise<CrawlSiteResult> {
  const pages: ScannedPage[] = [];
  const allLinks: PageLink[] = [];
  const allCodeBlocks: CodeBlock[] = [];
  const findings: Finding[] = [];

  // Store only element IDs per page (not full Cheerio DOM) to keep memory low
  const pageElementIds = new Map<string, Set<string>>();

  const storageDir = path.join(os.tmpdir(), `zivodoc-crawl-${Date.now()}`);
  await fs.mkdir(storageDir, { recursive: true });

  const config = new Configuration({
    storageClientOptions: {
      localDataDirectory: storageDir,
    },
  });

  const jsRenderUrls: string[] = [];

  try {
    const cheerioCrawler = new CheerioCrawler(
      {
        maxRequestsPerCrawl: options.maxPages,
        maxConcurrency: options.concurrency,
        requestHandlerTimeoutSecs: 30,
        additionalMimeTypes: [
          'text/plain',
          'text/markdown',
          'text/csv',
          'text/yaml',
          'text/x-yaml',
          'application/yaml',
          'application/pdf',
          'application/rss+xml',
          'application/atom+xml',
          'application/ld+json',
          'application/manifest+json',
          'application/octet-stream',
        ],
        async requestHandler({ request, $, enqueueLinks, contentType }) {
          const pageUrl = request.loadedUrl ?? request.url;

          const mime = contentType?.type ?? '';
          if (mime && mime !== 'text/html' && mime !== 'application/xhtml+xml') {
            return;
          }

          if (!$ || typeof $ !== 'function') return;

          const textLength = extractTextLength($);

          // Always enqueue links even if the page is a SPA shell —
          // nav links, footer links etc. are often in the static HTML
          await enqueueLinks({ strategy: 'same-domain' });

          if (textLength < MIN_TEXT_LENGTH) {
            jsRenderUrls.push(pageUrl);
            return;
          }

          const title = extractTitle($);
          const { links, codeBlocks } = extractFromPage($, pageUrl);

          pages.push({ url: pageUrl, title, codeBlocks, links });
          allLinks.push(...links);
          allCodeBlocks.push(...codeBlocks);

          const ids = new Set<string>();
          $('[id]').each((_, el) => {
            const id = $(el).attr('id');
            if (id) ids.add(id);
          });
          $('[name]').each((_, el) => {
            const name = $(el).attr('name');
            if (name) ids.add(name);
          });
          pageElementIds.set(normalizeUrl(pageUrl), ids);
        },
        async failedRequestHandler({ request }, error) {
          const msg = error instanceof Error ? error.message : String(error);
          // Crawlee rejects non-HTML content types (text/plain, PDF, etc.) — not truly broken
          if (msg.includes('Content-Type') && msg.includes('Skipping resource')) return;

          findings.push(
            createFinding({
              category: 'broken_link',
              severity: 'error',
              confidence: 'high',
              source: request.url,
              line: 0,
              title: `Failed to load page: ${request.url}`,
              description: msg,
              suggestion: 'Check if the URL is accessible.',
              evidence: { snippet: request.url, httpStatus: 0 },
            }),
          );
        },
      },
      config,
    );

    await cheerioCrawler.run([options.url]);

    // If Cheerio found zero pages, likely a full SPA — fall back to Playwright
    const needsPlaywright = jsRenderUrls.length > 0 || pages.length === 0;
    const playwrightBudget = Math.max(options.maxPages - pages.length, jsRenderUrls.length);
    const playwrightStartUrls = pages.length === 0 ? [options.url] : jsRenderUrls;

    if (needsPlaywright) {
      const playwrightStorageDir = storageDir + '-pw';
      await fs.mkdir(playwrightStorageDir, { recursive: true });
      const playwrightConfig = new Configuration({
        storageClientOptions: { localDataDirectory: playwrightStorageDir },
      });

      const playwrightCrawler = new PlaywrightCrawler(
        {
          maxRequestsPerCrawl: playwrightBudget,
          maxConcurrency: Math.min(options.concurrency, 3),
          requestHandlerTimeoutSecs: 60,
          headless: true,
          async requestHandler({ request, page, enqueueLinks }) {
            const pageUrl = request.loadedUrl ?? request.url;

            await page.waitForLoadState('networkidle').catch(() => {});

            const content = await page.content();
            const { load } = await import('cheerio');
            const $ = load(content);

            const title = extractTitle($);
            const { links, codeBlocks } = extractFromPage($, pageUrl);

            pages.push({ url: pageUrl, title, codeBlocks, links });
            allLinks.push(...links);
            allCodeBlocks.push(...codeBlocks);

            const ids = new Set<string>();
            $('[id]').each((_, el) => {
              const id = $(el).attr('id');
              if (id) ids.add(id);
            });
            $('[name]').each((_, el) => {
              const name = $(el).attr('name');
              if (name) ids.add(name);
            });
            pageElementIds.set(normalizeUrl(pageUrl), ids);

            await enqueueLinks({ strategy: 'same-domain' });
          },
          async failedRequestHandler({ request }, error) {
            const msg = error instanceof Error ? error.message : String(error);
            if (msg.includes('Content-Type') && msg.includes('Skipping resource')) return;

            findings.push(
              createFinding({
                category: 'broken_link',
                severity: 'error',
                confidence: 'high',
                source: request.url,
                line: 0,
                title: `Failed to render page: ${request.url}`,
                description: msg,
                suggestion: 'Check if the page requires JavaScript.',
                evidence: { snippet: request.url },
              }),
            );
          },
        },
        playwrightConfig,
      );

      await playwrightCrawler.run(playwrightStartUrls);
      await fs.rm(playwrightStorageDir, { recursive: true, force: true }).catch(() => {});
    }

    const anchorLinks = allLinks.filter((l) => l.type === 'anchor');
    const checkedAnchors = new Set<string>();

    for (const link of anchorLinks) {
      // resolveHref prepends the full URL, so href is like "https://site.com/page#fragment"
      let fragment: string;
      try {
        fragment = new URL(link.href).hash.slice(1);
      } catch {
        fragment = link.href.startsWith('#') ? link.href.slice(1) : '';
      }
      if (!fragment) continue;

      const dedupeKey = `${link.source}|${fragment}`;
      if (checkedAnchors.has(dedupeKey)) continue;
      checkedAnchors.add(dedupeKey);

      const ids = pageElementIds.get(normalizeUrl(link.source));
      if (!ids) continue;

      if (!ids.has(fragment)) {
        findings.push(brokenAnchorFinding(link.source, link.line, link.href));
      }
    }
  } finally {
    pageElementIds.clear();
    await fs.rm(storageDir, { recursive: true, force: true }).catch(() => {});
  }

  return {
    pages,
    findings,
    pagesScanned: pages.length,
    codeBlocksFound: allCodeBlocks.length,
    linksChecked: allLinks.filter((l) => l.type === 'external').length,
  };
}

/** Strip fragment and trailing slash for consistent map lookup */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}
