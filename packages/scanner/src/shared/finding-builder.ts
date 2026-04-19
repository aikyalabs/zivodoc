import type { Finding, FindingCategory, FindingSeverity } from '../types.js';

interface FindingInput {
  category: FindingCategory;
  severity: FindingSeverity;
  source: string;
  line: number;
  title: string;
  description: string;
  suggestion?: string;
  rawData?: Record<string, unknown>;
}

export function createFinding(input: FindingInput): Finding {
  return {
    category: input.category,
    severity: input.severity,
    source: input.source,
    line: input.line,
    title: input.title,
    description: input.description,
    ...(input.suggestion != null && { suggestion: input.suggestion }),
    ...(input.rawData != null && { rawData: input.rawData }),
  };
}

export function brokenLinkFinding(
  source: string,
  line: number,
  href: string,
  httpStatus?: number,
): Finding {
  return createFinding({
    category: 'broken_link',
    severity: 'error',
    source,
    line,
    title: `Broken link: ${href}`,
    description: `Link to "${href}" returned HTTP ${httpStatus ?? 'unknown'}`,
    suggestion: 'Remove the link or update it to a valid URL.',
    rawData: { href, httpStatus },
  });
}

export function redirectChainFinding(
  source: string,
  line: number,
  href: string,
  redirectUrl: string,
): Finding {
  return createFinding({
    category: 'redirect_chain',
    severity: 'warning',
    source,
    line,
    title: `Redirect chain: ${href}`,
    description: `Link to "${href}" redirects through multiple hops to "${redirectUrl}"`,
    suggestion: 'Update the link to point directly to the final destination.',
    rawData: { href, redirectUrl },
  });
}

export function brokenAnchorFinding(source: string, line: number, href: string): Finding {
  return createFinding({
    category: 'broken_anchor',
    severity: 'error',
    source,
    line,
    title: `Broken anchor: ${href}`,
    description: `Anchor link "${href}" does not match any element ID on the page`,
    suggestion: 'Fix the anchor to match an existing heading or element ID.',
    rawData: { href },
  });
}

export function syntaxErrorFinding(
  source: string,
  line: number,
  language: string | null,
  errorMessage: string,
  errorLine: number,
  errorColumn: number,
): Finding {
  return createFinding({
    category: 'syntax_error',
    severity: 'warning',
    source,
    line,
    title: `Code syntax error in ${language ?? 'unknown'} block`,
    description: `Syntax error at line ${errorLine}, column ${errorColumn}: ${errorMessage}`,
    suggestion: 'Fix the syntax error in the code block.',
    rawData: { language, errorMessage, errorLine, errorColumn },
  });
}

export function slowLinkFinding(
  source: string,
  line: number,
  href: string,
  durationMs: number,
): Finding {
  return createFinding({
    category: 'slow_link',
    severity: 'info',
    source,
    line,
    title: `Slow link: ${href}`,
    description: `Link to "${href}" took ${durationMs}ms to respond (>5000ms)`,
    suggestion: 'Consider if this link is still valid or if the server is slow.',
    rawData: { href, durationMs },
  });
}

export function timeoutFinding(source: string, line: number, href: string): Finding {
  return createFinding({
    category: 'broken_link',
    severity: 'warning',
    source,
    line,
    title: `Link timeout: ${href}`,
    description: `Link to "${href}" timed out after 10 seconds`,
    suggestion: 'Check if the URL is still valid.',
    rawData: { href },
  });
}
