export type ScanMode = 'site' | 'repo' | 'both';

export interface ScanOptions {
  mode: ScanMode;
  siteUrl?: string;
  repoUrl?: string;
  branch?: string;
  docPaths?: string[];
  maxPages?: number;
  concurrency?: number;
  authToken?: string;
  openapiSpecUrl?: string;
}

export type FindingSeverity = 'error' | 'warning' | 'info';
export type FindingConfidence = 'high' | 'medium' | 'low';

/**
 * Only categories where we can be objectively correct.
 * Subjective/noisy checks (readability, inclusive_lang, duplicate_word,
 * long_sentence, passive_voice, brand_inconsistency) are removed —
 * those are better handled by AI analysis in Phase 3.
 */
export type FindingCategory =
  | 'broken_link'
  | 'broken_anchor'
  | 'redirect_chain'
  | 'slow_link'
  | 'syntax_error'
  | 'empty_code_block'
  | 'missing_code_lang'
  | 'runtime_error'
  | 'type_error'
  | 'leaked_secret'
  | 'insecure_link'
  | 'internal_url'
  | 'missing_page'
  | 'heading_skip'
  | 'multiple_h1'
  | 'empty_section'
  | 'broken_image'
  | 'missing_alt_text'
  | 'todo_left'
  | 'placeholder_text'
  | 'outdated_date'
  | 'duplicate_content'
  | 'stale_ref'
  | 'missing_endpoint'
  | 'undocumented_endpoint'
  | 'wrong_http_method';

export interface FindingEvidence {
  /** The exact text/snippet that triggered the finding */
  snippet: string;
  /** Surrounding context (e.g., 3 lines before/after) */
  context?: string;
  /** HTTP status code for link checks */
  httpStatus?: number;
  /** Response time in ms for link checks */
  responseTimeMs?: number;
  /** Redirect chain for redirect_chain findings */
  redirectChain?: string[];
  /** The regex/pattern that matched for security checks */
  matchedPattern?: string;
  /** Expected value (e.g., expected heading level) */
  expected?: string;
  /** Actual value found */
  actual?: string;
}

export interface Finding {
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

export interface ScannedPage {
  url?: string;
  filePath?: string;
  title: string | null;
  rawContent?: string;
  codeBlocks: CodeBlock[];
  links: PageLink[];
}

export interface CodeBlock {
  source: string;
  language: string | null;
  code: string;
  lineStart: number;
  lineEnd: number;
}

export interface PageLink {
  source: string;
  href: string;
  text: string;
  line: number;
  type: 'internal' | 'external' | 'anchor';
}

export interface LinkCheckResult {
  link: PageLink;
  status: 'ok' | 'broken' | 'timeout' | 'redirect';
  httpStatus?: number;
  responseTimeMs?: number;
  redirectUrl?: string;
  redirectChain?: string[];
}

export interface CodeCheckResult {
  block: CodeBlock;
  valid: boolean;
  errors: { message: string; line: number; column: number }[];
}

export interface CodeExecutionResult {
  block: CodeBlock;
  executed: boolean;
  skipReason?: string;
  error?: { type: string; message: string };
}

export type ScanStepName =
  | 'crawl'
  | 'check_links'
  | 'check_code'
  | 'check_security'
  | 'check_structure'
  | 'check_content'
  | 'check_openapi'
  | 'report';

export interface ScanStep {
  name: ScanStepName;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  itemsProcessed?: number;
  findingsCount?: number;
}

export interface ScanReportSection {
  step: ScanStepName;
  title: string;
  summary: string;
  findings: Finding[];
  stats: Record<string, number | string>;
}

export interface ScanReport {
  title: string;
  url?: string;
  generatedAt: string;
  durationMs: number;
  summary: {
    pagesScanned: number;
    linksChecked: number;
    codeBlocksFound: number;
    totalFindings: number;
    byConfidence: { high: number; medium: number; low: number };
    bySeverity: { error: number; warning: number; info: number };
  };
  sections: ScanReportSection[];
  /** Full markdown report for LLM consumption */
  markdown: string;
}

export interface ScanResult {
  mode: ScanMode;
  pagesScanned: number;
  codeBlocksFound: number;
  linksChecked: number;
  findings: Finding[];
  steps: ScanStep[];
  report: ScanReport;
  duration: number;
  pages: ScannedPage[];
}
