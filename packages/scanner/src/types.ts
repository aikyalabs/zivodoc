export type ScanMode = 'site' | 'repo' | 'both';
export type FindingSeverity = 'error' | 'warning' | 'info';
export type FindingCategory =
  | 'broken_link'
  | 'broken_anchor'
  | 'redirect_chain'
  | 'syntax_error'
  | 'missing_page'
  | 'slow_link'
  | 'stale_ref'
  | 'insecure_link'
  | 'leaked_secret'
  | 'internal_url'
  | 'placeholder_text'
  | 'empty_section'
  | 'empty_code_block'
  | 'missing_code_lang'
  | 'heading_skip'
  | 'multiple_h1'
  | 'broken_image'
  | 'todo_left'
  | 'outdated_date'
  | 'readability'
  | 'duplicate_content'
  | 'inclusive_lang'
  | 'duplicate_word'
  | 'long_sentence'
  | 'passive_voice'
  | 'missing_alt_text'
  | 'brand_inconsistency';

export interface ScanOptions {
  mode: ScanMode;
  siteUrl?: string;
  repoUrl?: string;
  branch?: string;
  docPaths?: string[];
  maxPages?: number;
  concurrency?: number;
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
  redirectUrl?: string;
}

export interface CodeCheckResult {
  block: CodeBlock;
  valid: boolean;
  errors: { message: string; line: number; column: number }[];
}

export interface Finding {
  category: FindingCategory;
  severity: FindingSeverity;
  source: string;
  line: number;
  title: string;
  description: string;
  suggestion?: string;
  rawData?: Record<string, unknown>;
}

export interface ScanResult {
  mode: ScanMode;
  pagesScanned: number;
  codeBlocksFound: number;
  linksChecked: number;
  findings: Finding[];
  duration: number;
}
