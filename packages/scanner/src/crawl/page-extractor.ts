import type { CheerioAPI, Element } from 'cheerio';
import type { CodeBlock, PageLink } from '../types.js';

/**
 * Classify a link href into internal, external, or anchor.
 */
function classifyLink(href: string, baseUrl: string): 'internal' | 'external' | 'anchor' {
  if (href.startsWith('#')) return 'anchor';
  try {
    const parsed = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    if (parsed.hostname === base.hostname) return 'internal';
    return 'external';
  } catch {
    return 'internal'; // Relative links are internal
  }
}

/**
 * Extract links and code blocks from a Cheerio-loaded page.
 *
 * The `$` parameter is a CheerioAPI loaded document.
 */
export function extractFromPage(
  $: CheerioAPI,
  pageUrl: string,
): { links: PageLink[]; codeBlocks: CodeBlock[] } {
  const links: PageLink[] = [];
  const codeBlocks: CodeBlock[] = [];

  // Extract all links (<a href>, <img src>)
  $('a[href]').each((_i: number, el: Element) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (!href) return;
    // Skip javascript:, mailto:, tel: links
    if (/^(javascript|mailto|tel):/i.test(href)) return;

    links.push({
      source: pageUrl,
      href: resolveHref(href, pageUrl),
      text: text || '[no text]',
      line: 0, // HTML doesn't provide line numbers easily
      type: classifyLink(href, pageUrl),
    });
  });

  // Extract code blocks (<pre><code>)
  let blockIndex = 0;
  $('pre code, pre').each((_i: number, el: Element) => {
    const tagName = $(el).prop('tagName')?.toLowerCase();

    // If it's a <pre> that contains a <code>, skip (the code child will handle it)
    if (tagName === 'pre' && $(el).find('code').length > 0) return;

    const code = $(el).text().trim();
    if (!code) return;

    // Try to detect language from class
    const className: string = $(el).attr('class') ?? '';
    const parentClass: string = tagName === 'code' ? ($(el).parent().attr('class') ?? '') : '';
    const allClasses = `${className} ${parentClass}`;
    const langMatch = allClasses.match(/(?:language-|lang-|hljs-)(\w+)/);
    const language = langMatch ? langMatch[1] : null;

    codeBlocks.push({
      source: pageUrl,
      language,
      code,
      lineStart: blockIndex,
      lineEnd: blockIndex + code.split('\n').length - 1,
    });
    blockIndex++;
  });

  return { links, codeBlocks };
}

function resolveHref(href: string, baseUrl: string): string {
  if (href.startsWith('#')) return `${baseUrl}${href}`;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

/**
 * Extract the page title from a Cheerio-loaded document.
 */
export function extractTitle($: CheerioAPI): string | null {
  // Try <h1> first, then <title>
  const h1 = $('h1').first().text().trim();
  if (h1) return h1;
  const title = $('title').first().text().trim();
  if (title) return title;
  return null;
}

/**
 * Extract the visible text length from a Cheerio-loaded document.
 */
export function extractTextLength($: CheerioAPI): number {
  return $('body').text().trim().length;
}
