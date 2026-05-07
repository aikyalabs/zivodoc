import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import * as http from 'node:http';
import * as fs from 'node:fs';
import { discoverMarkdownFiles } from '../src/repo/file-discoverer.js';
import { parseMarkdownFile } from '../src/repo/markdown-parser.js';
import { validateCodeBlocks } from '../src/repo/code-validator.js';
import { executeCodeBlocks } from '../src/repo/code-executor.js';
import { analyzeContent } from '../src/analyze/content-analyzer.js';
import type { ScannedPage, Finding, CodeBlock } from '../src/types.js';

const REPO_FIXTURES = path.resolve(__dirname, 'fixtures/test-repo');
const SITE_FIXTURES = path.resolve(__dirname, 'fixtures/test-site');

// ─── Repo Integration Tests ────────────────────────────────────────────

describe('repo scanning integration', () => {
  let pages: ScannedPage[];
  let allCodeBlocks: CodeBlock[];
  let contentFindings: Finding[];
  let syntaxFindings: Finding[];
  let runtimeResults: Awaited<ReturnType<typeof executeCodeBlocks>>;

  beforeAll(async () => {
    const files = await discoverMarkdownFiles(REPO_FIXTURES);
    pages = [];
    allCodeBlocks = [];

    for (const file of files) {
      const page = await parseMarkdownFile(file);
      pages.push(page);
      allCodeBlocks.push(...page.codeBlocks);
    }

    contentFindings = analyzeContent(pages);

    const syntaxResults = validateCodeBlocks(allCodeBlocks);
    syntaxFindings = [];
    for (const result of syntaxResults) {
      if (!result.valid) {
        for (const err of result.errors) {
          syntaxFindings.push({
            category: 'syntax_error',
            severity: 'warning',
            confidence: 'high',
            source: result.block.source,
            line: result.block.lineStart,
            title: `Syntax error in ${result.block.language ?? 'code'} block`,
            description: err.message,
            evidence: { snippet: result.block.code.slice(0, 100) },
          });
        }
      }
    }

    runtimeResults = await executeCodeBlocks(
      allCodeBlocks.filter((b) => {
        const lang = b.language?.toLowerCase();
        return lang && ['js', 'javascript', 'jsx', 'mjs', 'cjs'].includes(lang);
      }),
    );
  }, 30000);

  // ─── Discovery ─────────────────────────────────────────────────

  it('discovers all markdown files', () => {
    expect(pages.length).toBe(5);
  });

  it('extracts code blocks from all pages', () => {
    expect(allCodeBlocks.length).toBeGreaterThanOrEqual(10);
  });

  // ─── Syntax Validation ─────────────────────────────────────────

  it('catches JavaScript syntax error in code-issues.md', () => {
    const found = syntaxFindings.some(
      (f) => f.category === 'syntax_error' && f.source.includes('code-issues'),
    );
    expect(found).toBe(true);
  });

  it('does not flag valid JavaScript as syntax error', () => {
    const falsePositive = syntaxFindings.some(
      (f) => f.source.includes('clean.md') || f.source.includes('README.md'),
    );
    expect(falsePositive).toBe(false);
  });

  // ─── Runtime Execution ─────────────────────────────────────────

  it('catches TypeError from null.toString()', () => {
    const found = runtimeResults.some((r) => r.executed && r.error?.type === 'TypeError');
    expect(found).toBe(true);
  });

  it('skips snippet with undeclared identifiers (app, db, router)', () => {
    const snippetBlock = runtimeResults.find(
      (r) => !r.executed && r.skipReason?.includes('undeclared'),
    );
    expect(snippetBlock).toBeDefined();
  });

  it('skips block with @zivodoc-skip annotation', () => {
    const skipped = runtimeResults.find((r) => !r.executed && r.skipReason === 'author opted out');
    expect(skipped).toBeDefined();
  });

  it('executes valid self-contained code without error', () => {
    const validBlock = runtimeResults.find(
      (r) => r.executed && !r.error && r.block.code.includes('doubled'),
    );
    expect(validBlock).toBeDefined();
  });

  it('does not execute TypeScript blocks', () => {
    const tsExecuted = runtimeResults.some((r) => r.block.language === 'typescript' && r.executed);
    expect(tsExecuted).toBe(false);
  });

  // ─── Content Analysis ──────────────────────────────────────────

  it('detects TODO in content-issues.md', () => {
    const found = contentFindings.some(
      (f) => f.category === 'todo_left' && f.source.includes('content-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects FIXME in content-issues.md', () => {
    const found = contentFindings.some(
      (f) =>
        f.category === 'todo_left' &&
        f.source.includes('content-issues') &&
        f.title.includes('FIXME'),
    );
    expect(found).toBe(true);
  });

  it('detects placeholder text YOUR_API_KEY_HERE', () => {
    const found = contentFindings.some(
      (f) => f.category === 'placeholder_text' && f.source.includes('content-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects outdated date (March 2020)', () => {
    const found = contentFindings.some(
      (f) => f.category === 'outdated_date' && f.source.includes('content-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects internal/staging URL', () => {
    const found = contentFindings.some(
      (f) => f.category === 'internal_url' && f.source.includes('content-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects leaked AWS secret', () => {
    const found = contentFindings.some(
      (f) => f.category === 'leaked_secret' && f.source.includes('content-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects empty code block', () => {
    const found = contentFindings.some(
      (f) => f.category === 'empty_code_block' && f.source.includes('code-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects missing code language tag', () => {
    const found = contentFindings.some(
      (f) => f.category === 'missing_code_lang' && f.source.includes('code-issues'),
    );
    expect(found).toBe(true);
  });

  // ─── Structure ─────────────────────────────────────────────────

  it('detects multiple H1 in structure-issues.md', () => {
    const found = contentFindings.some(
      (f) => f.category === 'multiple_h1' && f.source.includes('structure-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects empty section in structure-issues.md', () => {
    const found = contentFindings.some(
      (f) => f.category === 'empty_section' && f.source.includes('structure-issues'),
    );
    expect(found).toBe(true);
  });

  it('detects heading skip (H2 → H4) in structure-issues.md', () => {
    const found = contentFindings.some(
      (f) => f.category === 'heading_skip' && f.source.includes('structure-issues'),
    );
    expect(found).toBe(true);
  });

  // ─── False Positive Checks ────────────────────────────────────

  it('produces zero findings for clean.md', () => {
    const cleanFindings = contentFindings.filter((f) => f.source.includes('clean.md'));
    expect(cleanFindings).toHaveLength(0);
  });

  it('produces zero findings for README.md', () => {
    const readmeFindings = contentFindings.filter((f) => f.source.includes('README.md'));
    expect(readmeFindings).toHaveLength(0);
  });

  it('does not flag snippet blocks as runtime errors', () => {
    const snippetErrors = runtimeResults.filter(
      (r) => r.executed && r.error && r.block.code.includes('app.get'),
    );
    expect(snippetErrors).toHaveLength(0);
  });

  it('does not flag @zivodoc-skip blocks as runtime errors', () => {
    const skipErrors = runtimeResults.filter(
      (r) => r.executed && r.error && r.block.code.includes('@zivodoc-skip'),
    );
    expect(skipErrors).toHaveLength(0);
  });
});

// ─── Site Scanning Integration Tests ────────────────────────────────────

describe('site scanning integration', () => {
  let server: http.Server;
  let baseUrl: string;
  let pages: ScannedPage[];
  let contentFindings: Finding[];

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer((req, res) => {
        const url = req.url ?? '/';

        if (url === '/broken-page.html') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>404 Not Found</h1></body></html>');
          return;
        }

        const filePath = path.join(SITE_FIXTURES, url === '/' ? 'index.html' : url);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } catch {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>Not Found</h1></body></html>');
        }
      });

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });

    const { crawlSite } = await import('../src/crawl/site-crawler.js');
    const result = await crawlSite({ url: baseUrl, maxPages: 20, concurrency: 2 });
    pages = result.pages;
    contentFindings = analyzeContent(pages);
  }, 60000);

  afterAll(() => {
    return new Promise<void>((resolve) => {
      if (server) server.close(() => resolve());
      else resolve();
    });
  });

  it('crawls multiple pages from the test site', () => {
    expect(pages.length).toBeGreaterThanOrEqual(3);
  });

  it('extracts code blocks from HTML pages', () => {
    const totalCodeBlocks = pages.reduce((sum, p) => sum + p.codeBlocks.length, 0);
    expect(totalCodeBlocks).toBeGreaterThanOrEqual(4);
  });

  it('does not produce false positive content findings on crawled HTML', () => {
    // Site crawls extract structured data (links, code blocks) from HTML.
    // Content analysis (TODO, placeholder, headings) operates on rawContent
    // which is only set for repo/markdown scans — not site crawls.
    // This verifies no false positives from the empty rawContent path.
    const noiseCategories = ['todo_left', 'placeholder_text', 'outdated_date'];
    const noise = contentFindings.filter((f) => noiseCategories.includes(f.category));
    expect(noise).toHaveLength(0);
  });

  it('produces zero content findings for clean page', () => {
    const cleanPage = pages.find((p) => p.url?.includes('clean'));
    if (cleanPage) {
      const cleanUrl = cleanPage.url ?? '';
      const cleanFindings = contentFindings.filter((f) => f.source === cleanUrl);
      expect(cleanFindings).toHaveLength(0);
    }
  });
});
