import type {
  Finding,
  FindingCategory,
  FindingConfidence,
  FindingEvidence,
  FindingSeverity,
} from '../types.js';

interface FindingInput {
  category: FindingCategory;
  severity: FindingSeverity;
  confidence: FindingConfidence;
  source: string;
  line: number;
  title: string;
  description: string;
  suggestion?: string;
  evidence: FindingEvidence;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

export function createFinding(input: FindingInput): Finding {
  return {
    category: input.category,
    severity: input.severity,
    confidence: input.confidence,
    source: truncate(input.source, 500),
    line: input.line,
    title: truncate(input.title, 295),
    description: input.description,
    evidence: input.evidence,
    ...(input.suggestion != null && { suggestion: input.suggestion }),
  };
}

export function brokenLinkFinding(
  source: string,
  line: number,
  href: string,
  httpStatus: number | undefined,
  responseTimeMs?: number,
): Finding {
  return createFinding({
    category: 'broken_link',
    severity: 'error',
    confidence: httpStatus ? 'high' : 'medium',
    source,
    line,
    title: `Broken link: ${href}`,
    description: `Link returned HTTP ${httpStatus ?? 'unknown'}`,
    suggestion: 'Remove the link or update it to a valid URL.',
    evidence: {
      snippet: href,
      httpStatus,
      responseTimeMs,
    },
  });
}

export function timeoutFinding(
  source: string,
  line: number,
  href: string,
  responseTimeMs?: number,
): Finding {
  return createFinding({
    category: 'broken_link',
    severity: 'warning',
    confidence: 'medium',
    source,
    line,
    title: `Link timeout: ${href}`,
    description: `Link timed out after 10 seconds. May be a temporary server issue.`,
    suggestion: 'Verify the URL is still valid.',
    evidence: {
      snippet: href,
      responseTimeMs,
    },
  });
}

export function redirectChainFinding(
  source: string,
  line: number,
  href: string,
  redirectChain: string[],
): Finding {
  const final = redirectChain[redirectChain.length - 1] ?? href;
  const truncatedFinal = final.length > 80 ? final.slice(0, 80) + '…' : final;
  return createFinding({
    category: 'redirect_chain',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: `Redirect chain: ${href}`,
    description: `Link redirects through ${redirectChain.length} hops to ${truncatedFinal}`,
    suggestion: `Update link to point directly to the final destination.`,
    evidence: {
      snippet: href,
      redirectChain,
    },
  });
}

export function slowLinkFinding(
  source: string,
  line: number,
  href: string,
  responseTimeMs: number,
): Finding {
  return createFinding({
    category: 'slow_link',
    severity: 'info',
    confidence: 'high',
    source,
    line,
    title: `Slow link: ${href}`,
    description: `Link took ${responseTimeMs}ms to respond (>5000ms)`,
    suggestion: 'Check if the server is healthy or the URL is correct.',
    evidence: {
      snippet: href,
      responseTimeMs,
    },
  });
}

export function brokenAnchorFinding(source: string, line: number, href: string): Finding {
  return createFinding({
    category: 'broken_anchor',
    severity: 'warning',
    confidence: 'medium',
    source,
    line,
    title: `Broken anchor: ${href}`,
    description: `Anchor link does not match any element ID on the page`,
    suggestion: 'Fix the anchor to match an existing heading or element ID.',
    evidence: { snippet: href },
  });
}

export function syntaxErrorFinding(
  source: string,
  line: number,
  language: string | null,
  errorMessage: string,
  codeSnippet: string,
): Finding {
  return createFinding({
    category: 'syntax_error',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: `Syntax error in ${language ?? 'code'} block`,
    description: errorMessage,
    suggestion: 'Fix the syntax error in the code example.',
    evidence: {
      snippet: codeSnippet.slice(0, 200),
      actual: errorMessage,
    },
  });
}

export function runtimeErrorFinding(
  source: string,
  line: number,
  language: string | null,
  errorType: string,
  errorMessage: string,
  codeSnippet: string,
): Finding {
  return createFinding({
    category: 'runtime_error',
    severity: 'warning',
    confidence: 'medium',
    source,
    line,
    title: `${errorType} in ${language ?? 'code'} block`,
    description: errorMessage,
    suggestion: 'Fix the runtime error or add // @zivodoc-skip if this is an intentional snippet.',
    evidence: {
      snippet: codeSnippet.slice(0, 200),
      actual: `${errorType}: ${errorMessage}`,
    },
  });
}

export function emptyCodeBlockFinding(source: string, line: number): Finding {
  return createFinding({
    category: 'empty_code_block',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: 'Empty code block',
    description: 'Code block has no content.',
    suggestion: 'Add code content or remove the empty block.',
    evidence: { snippet: '```\n```' },
  });
}

export function missingCodeLangFinding(source: string, line: number, codeSnippet: string): Finding {
  return createFinding({
    category: 'missing_code_lang',
    severity: 'info',
    confidence: 'high',
    source,
    line,
    title: 'Code block missing language',
    description: 'Code block has no language specified for syntax highlighting.',
    suggestion: 'Add a language tag (e.g., ```javascript).',
    evidence: { snippet: codeSnippet.slice(0, 100) },
  });
}

export function leakedSecretFinding(
  source: string,
  line: number,
  patternName: string,
  matchedText: string,
  context: string,
): Finding {
  const masked =
    matchedText.length > 8 ? matchedText.slice(0, 4) + '…' + matchedText.slice(-4) : '***';

  return createFinding({
    category: 'leaked_secret',
    severity: 'error',
    confidence: 'high',
    source,
    line,
    title: `Potential ${patternName} detected`,
    description: `Found a pattern matching ${patternName} in documentation. This may expose credentials.`,
    suggestion: 'Remove the credential and rotate it immediately.',
    evidence: {
      snippet: masked,
      context: context.slice(0, 200),
      matchedPattern: patternName,
    },
  });
}

export function insecureLinkFinding(source: string, line: number, href: string): Finding {
  return createFinding({
    category: 'insecure_link',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: `Insecure HTTP link: ${href}`,
    description: 'Link uses HTTP instead of HTTPS.',
    suggestion: 'Update to use HTTPS.',
    evidence: { snippet: href },
  });
}

export function internalUrlFinding(
  source: string,
  line: number,
  href: string,
  context: string,
): Finding {
  return createFinding({
    category: 'internal_url',
    severity: 'warning',
    confidence: 'medium',
    source,
    line,
    title: `Internal/staging URL exposed: ${href}`,
    description: 'URL appears to reference an internal or staging environment.',
    suggestion: 'Replace with a production URL or placeholder.',
    evidence: {
      snippet: href,
      context: context.slice(0, 200),
    },
  });
}

export function headingSkipFinding(
  source: string,
  line: number,
  expected: string,
  actual: string,
): Finding {
  return createFinding({
    category: 'heading_skip',
    severity: 'info',
    confidence: 'high',
    source,
    line,
    title: `Heading level skipped: ${actual} after ${expected}`,
    description: `Expected ${expected} or lower but found ${actual}. Heading levels should not skip.`,
    suggestion: `Change to ${expected} or restructure the heading hierarchy.`,
    evidence: { snippet: actual, expected, actual },
  });
}

export function multipleH1Finding(source: string, line: number, heading: string): Finding {
  return createFinding({
    category: 'multiple_h1',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: 'Multiple H1 headings',
    description: `Found additional H1: "${heading}". Pages should have a single H1.`,
    suggestion: 'Change to H2 or remove the duplicate H1.',
    evidence: { snippet: heading },
  });
}

export function emptySectionFinding(source: string, line: number, heading: string): Finding {
  return createFinding({
    category: 'empty_section',
    severity: 'warning',
    confidence: 'medium',
    source,
    line,
    title: `Empty section: "${heading}"`,
    description: 'Heading has no content before the next heading.',
    suggestion: 'Add content or remove the empty heading.',
    evidence: { snippet: heading },
  });
}

export function todoLeftFinding(
  source: string,
  line: number,
  matchedText: string,
  context: string,
): Finding {
  return createFinding({
    category: 'todo_left',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: `TODO/FIXME left in docs`,
    description: `Found "${matchedText}" — this appears to be unfinished content.`,
    suggestion: 'Complete the TODO or remove it before publishing.',
    evidence: {
      snippet: matchedText,
      context: context.slice(0, 200),
    },
  });
}

export function placeholderFinding(
  source: string,
  line: number,
  matchedText: string,
  context: string,
): Finding {
  return createFinding({
    category: 'placeholder_text',
    severity: 'warning',
    confidence: 'high',
    source,
    line,
    title: `Placeholder text: "${matchedText}"`,
    description: 'Found placeholder text that should be replaced with real content.',
    suggestion: 'Replace with actual values.',
    evidence: {
      snippet: matchedText,
      context: context.slice(0, 200),
    },
  });
}

export function missingEndpointFinding(source: string, method: string, path: string): Finding {
  return createFinding({
    category: 'missing_endpoint',
    severity: 'warning',
    confidence: 'high',
    source,
    line: 0,
    title: `Endpoint not documented: ${method} ${path}`,
    description: `The OpenAPI spec defines ${method} ${path} but it is not referenced anywhere in the documentation.`,
    suggestion: 'Add documentation for this endpoint or mark it as internal in the spec.',
    evidence: { snippet: `${method} ${path}` },
  });
}

export function undocumentedEndpointFinding(
  source: string,
  line: number,
  method: string,
  path: string,
  context: string,
): Finding {
  return createFinding({
    category: 'undocumented_endpoint',
    severity: 'warning',
    confidence: 'medium',
    source,
    line,
    title: `Endpoint not in spec: ${method} ${path}`,
    description: `Documentation references ${method} ${path}, but this endpoint does not exist in the OpenAPI spec. It may be stale or removed.`,
    suggestion: 'Update the docs to remove the reference, or add the endpoint to the spec.',
    evidence: { snippet: `${method} ${path}`, context: context.slice(0, 200) },
  });
}

export function wrongHttpMethodFinding(
  source: string,
  line: number,
  path: string,
  docMethod: string,
  specMethods: string[],
  context: string,
): Finding {
  return createFinding({
    category: 'wrong_http_method',
    severity: 'error',
    confidence: 'high',
    source,
    line,
    title: `Wrong HTTP method for ${path}`,
    description: `Docs use ${docMethod} ${path}, but the spec defines ${specMethods.join('/')} for this path.`,
    suggestion: `Change to ${specMethods[0]} or update the spec.`,
    evidence: {
      snippet: `${docMethod} ${path}`,
      context: context.slice(0, 200),
      expected: specMethods.join('/'),
      actual: docMethod,
    },
  });
}

export function outdatedDateFinding(
  source: string,
  line: number,
  dateText: string,
  context: string,
): Finding {
  return createFinding({
    category: 'outdated_date',
    severity: 'info',
    confidence: 'medium',
    source,
    line,
    title: `Potentially outdated date: "${dateText}"`,
    description: 'This date reference may be outdated.',
    suggestion: 'Verify the date is still accurate or update it.',
    evidence: {
      snippet: dateText,
      context: context.slice(0, 200),
    },
  });
}
