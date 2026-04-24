import type { Finding, ScannedPage, CodeBlock, PageLink } from '../types.js';
import {
  leakedSecretFinding,
  emptyCodeBlockFinding,
  missingCodeLangFinding,
  internalUrlFinding,
  todoLeftFinding,
  placeholderFinding,
  outdatedDateFinding,
  headingSkipFinding,
  multipleH1Finding,
  emptySectionFinding,
  createFinding,
} from '../shared/finding-builder.js';

/**
 * Analyze scanned pages for content quality issues.
 *
 * ONLY checks where we can be objectively correct:
 * - Secrets, code quality, link quality, headings, TODOs, placeholders, dates
 *
 * REMOVED (too noisy, better for AI Phase 3):
 * - readability, duplicate_word, long_sentence, inclusive_lang, passive_voice
 */
export function analyzeContent(pages: ScannedPage[]): Finding[] {
  const findings: Finding[] = [];

  for (const page of pages) {
    const source = page.url ?? page.filePath ?? 'unknown';
    const content = page.rawContent ?? '';

    findings.push(...checkSecrets(source, content, page.codeBlocks));
    findings.push(...checkCodeBlockQuality(source, page.codeBlocks));
    findings.push(...checkLinkQuality(source, page.links));
    findings.push(...checkContentQuality(source, content));
    findings.push(...checkHeadings(source, content));
    findings.push(...checkMissingAltText(source, page));
  }

  findings.push(...checkDuplicateContent(pages));

  return findings;
}

function getProseLines(content: string): Array<{ text: string; lineNum: number }> {
  const lines = content.split('\n');
  const result: Array<{ text: string; lineNum: number }> = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (!inCodeBlock && line.trim().length > 0) {
      result.push({ text: line, lineNum: i + 1 });
    }
  }

  return result;
}

function getContextAround(content: string, lineNum: number, radius = 2): string {
  const lines = content.split('\n');
  const start = Math.max(0, lineNum - 1 - radius);
  const end = Math.min(lines.length, lineNum + radius);
  return lines.slice(start, end).join('\n');
}

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Token', pattern: /gh[ps]_[0-9a-zA-Z]{36,}/ },
  { name: 'GitHub OAuth', pattern: /gho_[0-9a-zA-Z]{36,}/ },
  { name: 'OpenAI API Key', pattern: /sk-[0-9a-zA-Z]{40,}/ },
  { name: 'Anthropic API Key', pattern: /sk-ant-[0-9a-zA-Z]{32,}/ },
  { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Publishable', pattern: /pk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Slack Token', pattern: /xox[bprs]-[0-9a-zA-Z-]{10,}/ },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/ },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  {
    name: 'Database URL with password',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@\s]{8,}@[^/\s]+/i,
  },
];

const EXAMPLE_SECRET_INDICATORS = [
  /your[_-]?api[_-]?key/i,
  /example/i,
  /placeholder/i,
  /replace/i,
  /insert/i,
  /xxx+/i,
  /\.{3,}/, // Ellipsis (sk-ant-...)
  /\*{3,}/, // Asterisks
];

function looksLikeExampleSecret(line: string): boolean {
  return EXAMPLE_SECRET_INDICATORS.some((p) => p.test(line));
}

function checkSecrets(source: string, content: string, codeBlocks: CodeBlock[]): Finding[] {
  const findings: Finding[] = [];

  for (const block of codeBlocks) {
    const blockLines = block.code.split('\n');
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];

      if (looksLikeExampleSecret(line)) continue;

      for (const { name, pattern } of SECRET_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          findings.push(
            leakedSecretFinding(
              source,
              block.lineStart + i,
              name,
              match[0],
              getContextAround(block.code, i + 1),
            ),
          );
        }
      }
    }
  }

  const proseLines = getProseLines(content);
  for (const { text, lineNum } of proseLines) {
    if (looksLikeExampleSecret(text)) continue;
    for (const { name, pattern } of SECRET_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        findings.push(
          leakedSecretFinding(source, lineNum, name, match[0], getContextAround(content, lineNum)),
        );
      }
    }
  }

  return findings;
}

function checkCodeBlockQuality(source: string, codeBlocks: CodeBlock[]): Finding[] {
  const findings: Finding[] = [];
  // For site-crawled pages (URL source), skip missing_code_lang —
  // sites use custom syntax highlighting that strips language classes.
  const isSiteCrawl = source.startsWith('http://') || source.startsWith('https://');

  for (const block of codeBlocks) {
    if (block.code.trim().length === 0) {
      findings.push(emptyCodeBlockFinding(source, block.lineStart));
      continue;
    }
    if (!isSiteCrawl && !block.language && block.code.trim().length > 10) {
      findings.push(missingCodeLangFinding(source, block.lineStart, block.code));
    }
  }
  return findings;
}

const KNOWN_PUBLIC_DOMAINS = new Set([
  'dev.to',
  'dev.mysql.com',
  'dev.azure.com',
  'developer.mozilla.org',
  'developer.apple.com',
  'developer.android.com',
  'developer.chrome.com',
  'staging.docs.github.com', // GitHub's public staging docs
]);

const PUBLIC_IPS = new Set(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4', '9.9.9.9']);

function isInternalUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase();
    if (KNOWN_PUBLIC_DOMAINS.has(host)) return false;
    if (PUBLIC_IPS.has(host)) return false;

    return (
      host.startsWith('staging.') ||
      host.startsWith('internal.') ||
      host.endsWith('.internal') ||
      host.endsWith('.local') ||
      host.endsWith('.ngrok.io') ||
      host.endsWith('.ngrok-free.app') ||
      host.includes('.tunnel.') ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(host) // Raw IP addresses (except known public)
    );
  } catch {
    return false;
  }
}

function checkLinkQuality(source: string, links: PageLink[]): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);

    if (isInternalUrl(link.href)) {
      findings.push(internalUrlFinding(source, link.line, link.href, link.text));
    }
  }
  return findings;
}

const TODO_PATTERNS = [
  { pattern: /\bTODO\b/, label: 'TODO' },
  { pattern: /\bFIXME\b/, label: 'FIXME' },
  { pattern: /\bHACK\b/, label: 'HACK' },
];

const TBD_PATTERN = /\bTBD\b(?!\s*[-:]?\s*\d)/; // "TBD" not followed by a number (TBD: 5)
const WIP_PATTERN = /\bWIP\b/;

const PLACEHOLDER_PATTERNS = [
  { pattern: /\byour[_-]?api[_-]?key[_-]?here\b/i, label: 'YOUR_API_KEY_HERE' },
  { pattern: /\byour[_-]?token[_-]?here\b/i, label: 'YOUR_TOKEN_HERE' },
  { pattern: /\byour[_-]?secret[_-]?here\b/i, label: 'YOUR_SECRET_HERE' },
  { pattern: /\bCHANGEME\b/, label: 'CHANGEME' },
  { pattern: /\blorem ipsum\b/i, label: 'Lorem ipsum' },
];

const OUTDATED_DATE_PATTERN =
  /(?:updated|last\s+(?:modified|updated|edited)|as\s+of)\s*:?\s*((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4})/i;

function checkContentQuality(source: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const proseLines = getProseLines(content);

  for (const { text, lineNum } of proseLines) {
    if (text.startsWith('#') || text.startsWith('|') || text.match(/^\s*[-*+]\s/)) continue;

    for (const { pattern, label } of TODO_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(todoLeftFinding(source, lineNum, label, getContextAround(content, lineNum)));
        break;
      }
    }

    if (TBD_PATTERN.test(text) || WIP_PATTERN.test(text)) {
      const matched = TBD_PATTERN.test(text) ? 'TBD' : 'WIP';
      findings.push(todoLeftFinding(source, lineNum, matched, getContextAround(content, lineNum)));
    }

    for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
      if (pattern.test(text)) {
        findings.push(
          placeholderFinding(source, lineNum, label, getContextAround(content, lineNum)),
        );
        break;
      }
    }

    const dateMatch = text.match(OUTDATED_DATE_PATTERN);
    if (dateMatch) {
      const yearMatch = dateMatch[1].match(/\d{4}/);
      const currentYear = new Date().getFullYear();
      if (yearMatch && parseInt(yearMatch[0]) < currentYear - 1) {
        findings.push(
          outdatedDateFinding(source, lineNum, dateMatch[1], getContextAround(content, lineNum)),
        );
      }
    }
  }

  return findings;
}

function checkHeadings(source: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  const headings: Array<{ level: number; text: string; line: number }> = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2], line: i + 1 });
    }
  }

  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length > 1) {
    for (const h1 of h1s.slice(1)) {
      findings.push(multipleH1Finding(source, h1.line, h1.text.substring(0, 60)));
    }
  }

  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.level > prev.level + 1) {
      findings.push(headingSkipFinding(source, curr.line, `H${prev.level + 1}`, `H${curr.level}`));
    }
  }

  for (let i = 0; i < headings.length - 1; i++) {
    const gap = headings[i + 1].line - headings[i].line;
    if (gap <= 1) {
      findings.push(
        emptySectionFinding(source, headings[i].line, headings[i].text.substring(0, 50)),
      );
    }
  }

  return findings;
}

function checkMissingAltText(source: string, page: ScannedPage): Finding[] {
  const findings: Finding[] = [];
  for (const link of page.links) {
    if (
      link.href.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) &&
      (!link.text || link.text.trim() === '' || link.text === '[image]')
    ) {
      findings.push(
        createFinding({
          category: 'missing_alt_text',
          severity: 'warning',
          confidence: 'high',
          source,
          line: link.line,
          title: `Image missing alt text: ${link.href.split('/').pop()}`,
          description: 'Image has no alt text — hurts accessibility and SEO.',
          suggestion: 'Add descriptive alt text.',
          evidence: { snippet: link.href },
        }),
      );
    }
  }
  return findings;
}

function checkDuplicateContent(pages: ScannedPage[]): Finding[] {
  const findings: Finding[] = [];
  const seen = new Map<string, string>(); // hash → source

  for (const page of pages) {
    const source = page.url ?? page.filePath ?? 'unknown';
    const content = page.rawContent ?? '';

    const paragraphs = content.split(/\n\s*\n/).filter((p) => {
      const t = p.trim();
      return (
        t.length > 200 &&
        !t.startsWith('```') &&
        !t.startsWith('#') &&
        !t.startsWith('|') &&
        !t.startsWith('>') // Skip blockquotes (often shared)
      );
    });

    for (const para of paragraphs) {
      const normalized = para.trim().toLowerCase().replace(/\s+/g, ' ').substring(0, 300);
      const hash = simpleHash(normalized);

      if (seen.has(hash) && seen.get(hash) !== source) {
        findings.push(
          createFinding({
            category: 'duplicate_content',
            severity: 'info',
            confidence: 'medium',
            source,
            line: 0,
            title: 'Duplicate content across pages',
            description: `Shares a paragraph with ${seen.get(hash)?.split('/').pop()}`,
            suggestion: 'Consolidate into one place and link.',
            evidence: {
              snippet: normalized.substring(0, 100) + '…',
            },
          }),
        );
      } else {
        seen.set(hash, source);
      }
    }
  }
  return findings;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}
