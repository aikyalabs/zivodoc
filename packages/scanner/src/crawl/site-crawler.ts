import { CheerioCrawler, PlaywrightCrawler, Configuration } from 'crawlee';
import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { ScannedPage, Finding, ScanResult, PageLink, CodeBlock } from '../types.js';
import { extractFromPage, extractTitle, extractTextLength } from './page-extractor.js';
import { checkLinks } from '../shared/link-checker.js';
import { createFinding } from '../shared/finding-builder.js';

const MIN_TEXT_LENGTH = 100;

interface CrawlSiteOptions {
  url: string;
  maxPages: number;
  concurrency: number;
}

export async function crawlSite(options: CrawlSiteOptions): Promise<ScanResult> {
  const startTime = Date.now();
  const pages: ScannedPage[] = [];
  const allLinks: PageLink[] = [];
  const allCodeBlocks: CodeBlock[] = [];
  const findings: Finding[] = [];

  // Set up temporary Crawlee storage
  const storageDir = path.join(os.tmpdir(), `zivodoc-crawl-${Date.now()}`);
  await fs.mkdir(storageDir, { recursive: true });

  const config = new Configuration({
    storageClientOptions: {
      localDataDirectory: storageDir,
    },
  });

  // Track which URLs need JS rendering
  const jsRenderUrls: string[] = [];

  try {
    // Phase 1: CheerioCrawler (fast HTML-only)
    const cheerioCrawler = new CheerioCrawler(
      {
        maxRequestsPerCrawl: options.maxPages,
        maxConcurrency: options.concurrency,
        requestHandlerTimeoutSecs: 30,
        async requestHandler({ request, $, enqueueLinks }) {
          const pageUrl = request.loadedUrl ?? request.url;

          const textLength = extractTextLength($);

          // If page has very little text, queue for JS rendering
          if (textLength < MIN_TEXT_LENGTH) {
            jsRenderUrls.push(pageUrl);
            return;
          }

          const title = extractTitle($);
          const { links, codeBlocks } = extractFromPage($, pageUrl);

          pages.push({
            url: pageUrl,
            title,
            codeBlocks,
            links,
          });

          allLinks.push(...links);
          allCodeBlocks.push(...codeBlocks);

          // Enqueue internal links on same domain
          await enqueueLinks({
            strategy: 'same-domain',
          });
        },
        async failedRequestHandler({ request }, error) {
          findings.push(
            createFinding({
              category: 'broken_link',
              severity: 'error',
              source: request.url,
              line: 0,
              title: `Failed to load page: ${request.url}`,
              description: `Page failed to load: ${error instanceof Error ? error.message : String(error)}`,
              suggestion: 'Check if the URL is accessible.',
            }),
          );
        },
      },
      config,
    );

    await cheerioCrawler.run([options.url]);

    // Phase 2: PlaywrightCrawler for JS-rendered pages
    if (jsRenderUrls.length > 0) {
      const playwrightCrawler = new PlaywrightCrawler(
        {
          maxRequestsPerCrawl: jsRenderUrls.length,
          maxConcurrency: Math.min(options.concurrency, 3),
          requestHandlerTimeoutSecs: 60,
          headless: true,
          async requestHandler({ request, page, enqueueLinks }) {
            const pageUrl = request.loadedUrl ?? request.url;

            // Wait for content to load
            await page.waitForLoadState('networkidle').catch(() => {
              // Timeout is okay, continue with what we have
            });

            const content = await page.content();

            // Use cheerio to parse the rendered HTML
            // We import cheerio dynamically since it's a dependency of crawlee
            const { load } = await import('cheerio');
            const $ = load(content);

            const title = extractTitle($);
            const { links, codeBlocks } = extractFromPage($, pageUrl);

            pages.push({
              url: pageUrl,
              title,
              codeBlocks,
              links,
            });

            allLinks.push(...links);
            allCodeBlocks.push(...codeBlocks);

            await enqueueLinks({
              strategy: 'same-domain',
            });
          },
          async failedRequestHandler({ request }, error) {
            findings.push(
              createFinding({
                category: 'broken_link',
                severity: 'error',
                source: request.url,
                line: 0,
                title: `Failed to render page: ${request.url}`,
                description: `JS-rendered page failed: ${error instanceof Error ? error.message : String(error)}`,
                suggestion: 'Check if the page requires specific browser capabilities.',
              }),
            );
          },
        },
        config,
      );

      await playwrightCrawler.run(jsRenderUrls);
    }

    // Phase 3: Check all external links
    const { findings: linkFindings } = await checkLinks(allLinks);
    findings.push(...linkFindings);

    // Check for broken anchors (internal # links)
    const anchorLinks = allLinks.filter((l) => l.type === 'anchor');
    for (const link of anchorLinks) {
      const hasPage = pages.some((p) => p.url === link.source);
      if (hasPage) {
        findings.push(
          createFinding({
            category: 'broken_anchor',
            severity: 'info',
            source: link.source,
            line: link.line,
            title: `Anchor link: ${link.href}`,
            description: `Anchor link "${link.href}" found — manual verification recommended`,
          }),
        );
      }
    }
  } finally {
    // Clean up temporary storage
    await fs.rm(storageDir, { recursive: true, force: true }).catch(() => {
      // Ignore cleanup errors
    });
  }

  const duration = Date.now() - startTime;

  return {
    mode: 'site',
    pagesScanned: pages.length,
    codeBlocksFound: allCodeBlocks.length,
    linksChecked: allLinks.filter((l) => l.type === 'external').length,
    findings,
    duration,
  };
}
