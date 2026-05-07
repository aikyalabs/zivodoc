import { describe, it, expect } from 'vitest';
import { analyzeContent } from '../src/analyze/content-analyzer.js';
import type { ScannedPage } from '../src/types.js';

function makePage(overrides: Partial<ScannedPage> = {}): ScannedPage {
  return {
    filePath: '/test/doc.md',
    title: 'Test',
    rawContent: '',
    codeBlocks: [],
    links: [],
    ...overrides,
  };
}

describe('content-analyzer', () => {
  describe('secret detection', () => {
    it('detects AWS access keys in code blocks', () => {
      const page = makePage({
        codeBlocks: [
          {
            source: '/test.md',
            language: 'bash',
            code: 'export KEY=AKIAIOSFODNN7REALKEY1',
            lineStart: 1,
            lineEnd: 1,
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'leaked_secret')).toBe(true);
    });

    it('skips example secrets with placeholder indicators', () => {
      const page = makePage({
        codeBlocks: [
          {
            source: '/test.md',
            language: 'bash',
            code: 'export KEY=AKIAIOSFODNN7EXAMPLE # replace with your API key',
            lineStart: 1,
            lineEnd: 1,
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'leaked_secret')).toBe(false);
    });
  });

  describe('code block quality', () => {
    it('detects empty code blocks', () => {
      const page = makePage({
        codeBlocks: [{ source: '/test.md', language: 'js', code: '   ', lineStart: 5, lineEnd: 5 }],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'empty_code_block')).toBe(true);
    });

    it('detects missing language tag on file paths (repo mode)', () => {
      const page = makePage({
        filePath: '/docs/readme.md',
        codeBlocks: [
          {
            source: '/docs/readme.md',
            language: null,
            code: 'const x = 1;\nconst y = 2;',
            lineStart: 10,
            lineEnd: 11,
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'missing_code_lang')).toBe(true);
    });

    it('skips missing language tag for site-crawled pages', () => {
      const page = makePage({
        url: 'https://docs.example.com/page',
        codeBlocks: [
          {
            source: 'https://docs.example.com/page',
            language: null,
            code: 'const x = 1;\nconst y = 2;',
            lineStart: 10,
            lineEnd: 11,
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'missing_code_lang')).toBe(false);
    });
  });

  describe('content quality', () => {
    it('detects TODO in prose', () => {
      const page = makePage({ rawContent: 'Some text\n\nTODO: finish this\n\nMore text' });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'todo_left')).toBe(true);
    });

    it('skips TODO inside code blocks', () => {
      const page = makePage({
        rawContent: 'Text\n\n```js\n// TODO: refactor later\n```\n\nMore text',
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'todo_left')).toBe(false);
    });

    it('detects placeholder text', () => {
      const page = makePage({ rawContent: 'Set your token: YOUR_API_KEY_HERE' });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'placeholder_text')).toBe(true);
    });

    it('detects outdated dates', () => {
      const page = makePage({ rawContent: 'Last updated: January 2020' });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'outdated_date')).toBe(true);
    });

    it('ignores recent dates', () => {
      const currentYear = new Date().getFullYear();
      const page = makePage({ rawContent: `Last updated: January ${currentYear}` });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'outdated_date')).toBe(false);
    });
  });

  describe('heading structure', () => {
    it('detects multiple H1 headings', () => {
      const page = makePage({ rawContent: '# Title\n\nSome content\n\n# Another Title' });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'multiple_h1')).toBe(true);
    });

    it('detects skipped heading levels', () => {
      const page = makePage({ rawContent: '# Title\n\nContent\n\n#### Skipped to H4' });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'heading_skip')).toBe(true);
    });

    it('detects empty sections', () => {
      const page = makePage({ rawContent: '# Title\n## Section A\n## Section B\n\nContent' });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'empty_section')).toBe(true);
    });

    it('does not flag headings inside code blocks', () => {
      const page = makePage({
        rawContent: '# Title\n\nContent\n\n```md\n# Example heading\n```\n\nMore content',
      });
      const findings = analyzeContent([page]);
      expect(findings.filter((f) => f.category === 'multiple_h1')).toHaveLength(0);
    });
  });

  describe('link quality', () => {
    it('detects internal/staging URLs', () => {
      const page = makePage({
        links: [
          {
            source: '/test.md',
            href: 'https://staging.myapp.com/api',
            text: 'API',
            line: 5,
            type: 'external',
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'internal_url')).toBe(true);
    });

    it('does not flag known public domains', () => {
      const page = makePage({
        links: [
          {
            source: '/test.md',
            href: 'https://dev.to/article',
            text: 'Article',
            line: 5,
            type: 'external',
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'internal_url')).toBe(false);
    });

    it('does not flag public IPs like 1.1.1.1', () => {
      const page = makePage({
        links: [
          {
            source: '/test.md',
            href: 'https://1.1.1.1/dns/',
            text: 'DNS',
            line: 5,
            type: 'external',
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.some((f) => f.category === 'internal_url')).toBe(false);
    });
  });

  describe('finding properties', () => {
    it('all findings have confidence and evidence', () => {
      const page = makePage({
        rawContent: '# Title\n\nTODO: fix\n\n# Second H1\n\nYOUR_API_KEY_HERE',
        codeBlocks: [
          {
            source: '/test.md',
            language: null,
            code: 'some code here yo',
            lineStart: 1,
            lineEnd: 1,
          },
        ],
      });
      const findings = analyzeContent([page]);
      expect(findings.length).toBeGreaterThan(0);
      for (const f of findings) {
        expect(f.confidence).toBeDefined();
        expect(f.evidence).toBeDefined();
        expect(f.evidence.snippet).toBeDefined();
      }
    });
  });
});
