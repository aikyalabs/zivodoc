import type { Finding, ScannedPage, CodeBlock, PageLink } from '../types.js';
import { createFinding } from '../shared/finding-builder.js';

/**
 * Analyze scanned pages for content quality issues.
 * All checks are pattern-based — no AI, no network calls.
 */
export function analyzeContent(pages: ScannedPage[]): Finding[] {
  const findings: Finding[] = [];

  for (const page of pages) {
    const source = page.url ?? page.filePath ?? 'unknown';
    const content = page.rawContent ?? getContentText(page);

    findings.push(...checkSecrets(source, page.codeBlocks));
    findings.push(...checkCodeBlockQuality(source, page.codeBlocks));
    findings.push(...checkLinkQuality(source, page.links));
    findings.push(...checkContentQuality(source, content, page));
    findings.push(...checkHeadings(source, content));
    findings.push(...checkReadability(source, content));
    findings.push(...checkWritingQuality(source, content));
    findings.push(...checkInclusiveLanguage(source, content));
    findings.push(...checkMissingAltText(source, page));
  }

  findings.push(...checkDuplicateContent(pages));

  return findings;
}

// ── Secret Detection ──

const SECRET_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Token', pattern: /gh[ps]_[0-9a-zA-Z]{36,}/ },
  { name: 'GitHub OAuth', pattern: /gho_[0-9a-zA-Z]{36,}/ },
  { name: 'OpenAI API Key', pattern: /sk-[0-9a-zA-Z]{32,}/ },
  { name: 'Anthropic API Key', pattern: /sk-ant-[0-9a-zA-Z]{32,}/ },
  { name: 'Stripe Secret Key', pattern: /sk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Stripe Publishable', pattern: /pk_live_[0-9a-zA-Z]{24,}/ },
  { name: 'Slack Token', pattern: /xox[bprs]-[0-9a-zA-Z-]{10,}/ },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/ },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  {
    name: 'Database URL with password',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@\s]{4,}@[^/\s]+/i,
  },
];

function checkSecrets(source: string, codeBlocks: CodeBlock[]): Finding[] {
  const findings: Finding[] = [];
  for (const block of codeBlocks) {
    for (const { name, pattern } of SECRET_PATTERNS) {
      if (pattern.test(block.code)) {
        findings.push(
          createFinding({
            category: 'leaked_secret',
            severity: 'error',
            source,
            line: block.lineStart,
            title: `Possible ${name} in code block`,
            description: `A pattern matching "${name}" was found. If this is a real credential, remove it immediately.`,
            suggestion:
              'Replace with a placeholder like YOUR_API_KEY or use environment variable reference.',
            rawData: { secretType: name, language: block.language },
          }),
        );
      }
    }
  }
  return findings;
}

// ── Code Block Quality ──

function checkCodeBlockQuality(source: string, codeBlocks: CodeBlock[]): Finding[] {
  const findings: Finding[] = [];
  for (const block of codeBlocks) {
    if (block.code.trim().length === 0) {
      findings.push(
        createFinding({
          category: 'empty_code_block',
          severity: 'warning',
          source,
          line: block.lineStart,
          title: 'Empty code block',
          description: 'Code block has no content.',
          suggestion: 'Add code or remove the empty block.',
        }),
      );
      continue;
    }
    if (!block.language) {
      findings.push(
        createFinding({
          category: 'missing_code_lang',
          severity: 'info',
          source,
          line: block.lineStart,
          title: 'Code block without language specified',
          description: "No language tag. Syntax highlighting won't work.",
          suggestion: 'Add language (```javascript, ```python, etc).',
        }),
      );
    }
  }
  return findings;
}

// ── Link Quality ──

const KNOWN_PUBLIC_DOMAINS = new Set([
  'dev.to',
  'dev.mysql.com',
  'dev.azure.com',
  'developer.mozilla.org',
  'developer.apple.com',
  'developer.android.com',
  'developer.chrome.com',
]);

function checkLinkQuality(source: string, links: PageLink[]): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (seen.has(link.href)) continue;
    seen.add(link.href);

    if (link.href.startsWith('http://') && !isLocalUrl(link.href)) {
      findings.push(
        createFinding({
          category: 'insecure_link',
          severity: 'warning',
          source,
          line: link.line,
          title: `Insecure HTTP link: ${link.href}`,
          description: 'Uses HTTP instead of HTTPS.',
          suggestion: 'Change to HTTPS if the site supports it.',
          rawData: { href: link.href },
        }),
      );
    }

    if (isInternalUrl(link.href)) {
      findings.push(
        createFinding({
          category: 'internal_url',
          severity: 'error',
          source,
          line: link.line,
          title: `Internal URL exposed: ${link.href}`,
          description: 'Appears to be an internal/staging URL that users cannot access.',
          suggestion: 'Replace with the public production URL.',
          rawData: { href: link.href },
        }),
      );
    }
  }
  return findings;
}

function isLocalUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  } catch {
    return false;
  }
}

function isInternalUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase();
    if (KNOWN_PUBLIC_DOMAINS.has(host)) return false;

    return (
      host.includes('staging.') ||
      host.includes('internal.') ||
      host.includes('.internal') ||
      host.includes('.local') ||
      host.includes('ngrok.io') ||
      host.includes('ngrok-free.app') ||
      host.includes('.tunnel.') ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(host)
    );
  } catch {
    return false;
  }
}

// ── Content Quality ──

const TODO_PATTERNS = [/\bTODO\b/, /\bFIXME\b/, /\bHACK\b/, /\bTBD\b/, /\bWIP\b/];

const PLACEHOLDER_PATTERNS = [
  /lorem ipsum/i,
  /your[_-]?api[_-]?key[_-]?here/i,
  /your[_-]?token[_-]?here/i,
  /your[_-]?secret[_-]?here/i,
  /CHANGEME/i,
];

const OUTDATED_DATE_PATTERN =
  /(?:updated|last\s+(?:modified|updated|edited)|as\s+of)\s*:?\s*(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i;

function checkContentQuality(source: string, content: string, _page: ScannedPage): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (const pattern of TODO_PATTERNS) {
      if (pattern.test(line)) {
        findings.push(
          createFinding({
            category: 'todo_left',
            severity: 'warning',
            source,
            line: i + 1,
            title: `Unresolved ${line.match(pattern)?.[0] ?? 'TODO'} in documentation`,
            description: 'Developer note that should be resolved before publishing.',
            suggestion: 'Complete the work or remove the note.',
          }),
        );
        break;
      }
    }

    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(line)) {
        findings.push(
          createFinding({
            category: 'placeholder_text',
            severity: 'warning',
            source,
            line: i + 1,
            title: 'Placeholder text detected',
            description: 'Found placeholder text that should be replaced.',
            suggestion: 'Replace with actual content.',
          }),
        );
        break;
      }
    }

    const dateMatch = line.match(OUTDATED_DATE_PATTERN);
    if (dateMatch) {
      const year = line.match(/\d{4}/)?.[0];
      const currentYear = new Date().getFullYear();
      if (year && parseInt(year) < currentYear - 1) {
        findings.push(
          createFinding({
            category: 'outdated_date',
            severity: 'info',
            source,
            line: i + 1,
            title: `Potentially outdated: "${dateMatch[0]}"`,
            description: `References a date from ${year} — content may be stale.`,
            suggestion: 'Review and update if needed.',
            rawData: { year },
          }),
        );
      }
    }
  }

  return findings;
}

// ── Heading Structure ──

function checkHeadings(source: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const headings: Array<{ level: number; text: string; line: number }> = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue; // Skip headings inside code blocks

    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2], line: i + 1 });
    }
  }

  // Multiple H1s
  const h1s = headings.filter((h) => h.level === 1);
  if (h1s.length > 1) {
    for (const h1 of h1s.slice(1)) {
      findings.push(
        createFinding({
          category: 'multiple_h1',
          severity: 'warning',
          source,
          line: h1.line,
          title: 'Multiple H1 headings',
          description: `Extra H1 "${h1.text.substring(0, 60)}". A page should have one H1.`,
          suggestion: 'Change to H2.',
        }),
      );
    }
  }

  // Skipped levels
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.level > prev.level + 1) {
      findings.push(
        createFinding({
          category: 'heading_skip',
          severity: 'info',
          source,
          line: curr.line,
          title: `Skipped heading: H${prev.level} → H${curr.level}`,
          description: `"${curr.text.substring(0, 50)}" skips heading levels.`,
          suggestion: `Use H${prev.level + 1} instead.`,
        }),
      );
    }
  }

  // Empty sections — only flag if truly no content (0 lines between)
  for (let i = 0; i < headings.length - 1; i++) {
    if (headings[i + 1].line - headings[i].line <= 1) {
      findings.push(
        createFinding({
          category: 'empty_section',
          severity: 'warning',
          source,
          line: headings[i].line,
          title: `Empty section: "${headings[i].text.substring(0, 50)}"`,
          description: 'No content between this heading and the next.',
          suggestion: 'Add content or remove.',
        }),
      );
    }
  }

  return findings;
}

// ── Readability ──

function checkReadability(source: string, content: string): Finding[] {
  const findings: Finding[] = [];

  const plainText = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~>|]/g, '')
    .replace(/^\s*[-+]\s/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();

  // Skip if mostly non-prose (lists, links, short page)
  const words = plainText.split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 200) return findings; // Too short for meaningful readability

  const sentences = plainText.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length > 3);
  if (sentences.length < 5) return findings; // Too few sentences

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  const readingTime = Math.ceil(wordCount / 250);

  if (fleschScore < 20 && fleschScore > -100) {
    findings.push(
      createFinding({
        category: 'readability',
        severity: 'warning',
        source,
        line: 1,
        title: `Difficult to read (Flesch score: ${Math.round(fleschScore)})`,
        description: `${wordCount} words, ${sentenceCount} sentences, ~${readingTime} min read. Avg ${avgWordsPerSentence.toFixed(1)} words/sentence. Aim for shorter sentences and simpler words.`,
        suggestion: 'Break long sentences, use simpler words.',
        rawData: { fleschScore: Math.round(fleschScore), wordCount, readingTime },
      }),
    );
  }

  return findings;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// ── Writing Quality ──

function checkWritingQuality(source: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock || line.startsWith('#') || line.trim().length === 0) continue;
    if (line.startsWith('|') || line.startsWith('  ') || line.startsWith('\t')) continue; // skip tables, indented

    // Consecutive duplicate words
    const dupeMatch = line.match(/\b(\w{3,})\s+\1\b/i);
    if (dupeMatch && !['that', 'had', 'the'].includes(dupeMatch[1].toLowerCase())) {
      findings.push(
        createFinding({
          category: 'duplicate_word',
          severity: 'warning',
          source,
          line: i + 1,
          title: `Repeated word: "${dupeMatch[1]}"`,
          description: `"${dupeMatch[1]}" appears twice consecutively.`,
          suggestion: 'Remove the duplicate.',
        }),
      );
    }

    // Very long sentences (>60 words — higher threshold to avoid false positives)
    const sentenceWords = line.split(/\s+/).filter((w) => w.length > 0).length;
    if (sentenceWords > 60) {
      findings.push(
        createFinding({
          category: 'long_sentence',
          severity: 'info',
          source,
          line: i + 1,
          title: `Very long paragraph (${sentenceWords} words)`,
          description: 'Long paragraphs are hard to scan in technical docs.',
          suggestion: 'Break into shorter paragraphs.',
          rawData: { wordCount: sentenceWords },
        }),
      );
    }
  }

  return findings;
}

// ── Inclusive Language ──

const INCLUSIVE_LANGUAGE_RULES: Array<{ pattern: RegExp; term: string; suggestion: string }> = [
  {
    pattern: /\bblacklist(ed|ing|s)?\b/i,
    term: 'blacklist',
    suggestion: 'Use "blocklist" or "deny list"',
  },
  {
    pattern: /\bwhitelist(ed|ing|s)?\b/i,
    term: 'whitelist',
    suggestion: 'Use "allowlist" or "permit list"',
  },
  {
    pattern: /\bmaster\s*\/\s*slave/i,
    term: 'master/slave',
    suggestion: 'Use "primary/replica" or "leader/follower"',
  },
  {
    pattern: /\bsanity\s*check/i,
    term: 'sanity check',
    suggestion: 'Use "confidence check" or "smoke test"',
  },
  { pattern: /\bgrandfathered/i, term: 'grandfathered', suggestion: 'Use "legacy" or "exempted"' },
];

function checkInclusiveLanguage(source: string, content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    for (const rule of INCLUSIVE_LANGUAGE_RULES) {
      if (rule.pattern.test(line)) {
        findings.push(
          createFinding({
            category: 'inclusive_lang',
            severity: 'info',
            source,
            line: i + 1,
            title: `Consider inclusive alternative for "${rule.term}"`,
            description: `${rule.suggestion}.`,
            suggestion: rule.suggestion,
          }),
        );
      }
    }
  }
  return findings;
}

// ── Alt Text ──

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
          source,
          line: link.line,
          title: `Image missing alt text`,
          description: `Image "${link.href.split('/').pop()}" has no alt text.`,
          suggestion: 'Add descriptive alt text for accessibility and SEO.',
          rawData: { href: link.href },
        }),
      );
    }
  }
  return findings;
}

// ── Duplicate Content (cross-page) ──

function checkDuplicateContent(pages: ScannedPage[]): Finding[] {
  const findings: Finding[] = [];
  const seen = new Map<string, string>();

  for (const page of pages) {
    const source = page.url ?? page.filePath ?? 'unknown';
    const content = page.rawContent ?? getContentText(page);

    const paragraphs = content.split(/\n\s*\n/).filter((p) => {
      const t = p.trim();
      return t.length > 150 && !t.startsWith('```') && !t.startsWith('#') && !t.startsWith('|');
    });

    for (const para of paragraphs) {
      const normalized = para.trim().toLowerCase().replace(/\s+/g, ' ').substring(0, 200);
      const hash = simpleHash(normalized);

      if (seen.has(hash) && seen.get(hash) !== source) {
        findings.push(
          createFinding({
            category: 'duplicate_content',
            severity: 'info',
            source,
            line: 0,
            title: 'Duplicate content across pages',
            description: `Shares content with ${seen.get(hash)?.split('/').pop()}: "${normalized.substring(0, 80)}..."`,
            suggestion: 'Consolidate or link between pages.',
            rawData: { otherSource: seen.get(hash) },
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

function getContentText(page: ScannedPage): string {
  if (page.rawContent) return page.rawContent;
  const parts: string[] = [];
  if (page.title) parts.push(`# ${page.title}`);
  for (const block of page.codeBlocks) parts.push(block.code);
  for (const link of page.links) parts.push(link.text);
  return parts.join('\n');
}
