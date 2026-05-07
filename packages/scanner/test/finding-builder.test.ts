import { describe, it, expect } from 'vitest';
import {
  createFinding,
  brokenLinkFinding,
  redirectChainFinding,
  timeoutFinding,
  slowLinkFinding,
  syntaxErrorFinding,
  emptyCodeBlockFinding,
  missingCodeLangFinding,
  leakedSecretFinding,
  insecureLinkFinding,
  headingSkipFinding,
  multipleH1Finding,
  todoLeftFinding,
  placeholderFinding,
} from '../src/shared/finding-builder.js';

describe('finding-builder', () => {
  it('creates findings with all required fields', () => {
    const finding = createFinding({
      category: 'broken_link',
      severity: 'error',
      confidence: 'high',
      source: 'https://example.com/page',
      line: 10,
      title: 'Test finding',
      description: 'Test description',
      evidence: { snippet: 'https://broken.com' },
    });

    expect(finding.category).toBe('broken_link');
    expect(finding.severity).toBe('error');
    expect(finding.confidence).toBe('high');
    expect(finding.source).toBe('https://example.com/page');
    expect(finding.line).toBe(10);
    expect(finding.title).toBe('Test finding');
    expect(finding.evidence.snippet).toBe('https://broken.com');
  });

  it('truncates long titles to 295 chars', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(400);
    const finding = brokenLinkFinding('/page', 1, longUrl, 404);
    expect(finding.title.length).toBeLessThanOrEqual(295);
  });

  it('truncates long source to 500 chars', () => {
    const longSource = 'https://example.com/' + 'a'.repeat(600);
    const finding = brokenLinkFinding(longSource, 1, 'https://broken.com', 404);
    expect(finding.source.length).toBeLessThanOrEqual(500);
  });

  it('broken link has HTTP status in evidence', () => {
    const finding = brokenLinkFinding('/page', 5, 'https://broken.com', 404, 234);
    expect(finding.evidence.httpStatus).toBe(404);
    expect(finding.evidence.responseTimeMs).toBe(234);
    expect(finding.confidence).toBe('high');
  });

  it('timeout finding has medium confidence', () => {
    const finding = timeoutFinding('/page', 5, 'https://slow.com', 10000);
    expect(finding.confidence).toBe('medium');
    expect(finding.category).toBe('broken_link');
    expect(finding.severity).toBe('warning');
  });

  it('redirect chain truncates long final URL', () => {
    const longUrl = 'https://example.com/' + 'x'.repeat(200);
    const finding = redirectChainFinding('/page', 1, 'https://start.com', [longUrl]);
    expect(finding.description.length).toBeLessThan(200);
  });

  it('leaked secret masks the matched text', () => {
    const finding = leakedSecretFinding('/page', 10, 'AWS Key', 'AKIAIOSFODNN7EXAMPLE', 'context');
    expect(finding.evidence.snippet).not.toContain('AKIAIOSFODNN7EXAMPLE');
    expect(finding.evidence.snippet).toContain('…');
  });

  it('insecure link finding has high confidence', () => {
    const finding = insecureLinkFinding('/page', 5, 'http://example.com');
    expect(finding.confidence).toBe('high');
    expect(finding.category).toBe('insecure_link');
  });

  it('syntax error includes code snippet in evidence', () => {
    const finding = syntaxErrorFinding(
      '/page',
      10,
      'javascript',
      'Unexpected token',
      'const x = {',
    );
    expect(finding.evidence.snippet).toBe('const x = {');
  });
});
