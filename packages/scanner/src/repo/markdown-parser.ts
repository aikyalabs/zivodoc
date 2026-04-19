import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { toString as mdastToString } from 'mdast-util-to-string';
import * as fs from 'node:fs/promises';
import type { CodeBlock, PageLink, ScannedPage } from '../types.js';
import type { Code, Link, Image, Heading, Root } from 'mdast';

const parser = unified().use(remarkParse).use(remarkGfm);

/**
 * Classify a link href from markdown context.
 */
function classifyLink(href: string): 'internal' | 'external' | 'anchor' {
  if (href.startsWith('#')) return 'anchor';
  if (/^https?:\/\//.test(href)) return 'external';
  return 'internal';
}

/**
 * Walk an MDAST tree and collect nodes of specific types.
 */
function walkTree<T>(node: Root | Root['children'][number], type: string, results: T[] = []): T[] {
  if (node.type === type) {
    results.push(node as T);
  }
  if ('children' in node) {
    for (const child of (node as Root).children) {
      walkTree(child, type, results);
    }
  }
  return results;
}

/**
 * Parse a markdown file and extract code blocks and links.
 */
export async function parseMarkdownFile(filePath: string): Promise<ScannedPage> {
  const content = await fs.readFile(filePath, 'utf-8');
  const tree = parser.parse(content);

  const codeBlocks: CodeBlock[] = [];
  const links: PageLink[] = [];

  // Extract code blocks
  const codeNodes = walkTree<Code>(tree, 'code');
  for (const node of codeNodes) {
    const startLine = node.position?.start.line ?? 0;
    const endLine = node.position?.end.line ?? startLine;

    codeBlocks.push({
      source: filePath,
      language: node.lang ?? null,
      code: node.value,
      lineStart: startLine,
      lineEnd: endLine,
    });
  }

  // Extract links
  const linkNodes = walkTree<Link>(tree, 'link');
  for (const node of linkNodes) {
    const line = node.position?.start.line ?? 0;
    const text = mdastToString(node);

    links.push({
      source: filePath,
      href: node.url,
      text: text || '[no text]',
      line,
      type: classifyLink(node.url),
    });
  }

  // Extract images (also have URLs)
  const imageNodes = walkTree<Image>(tree, 'image');
  for (const node of imageNodes) {
    const line = node.position?.start.line ?? 0;

    links.push({
      source: filePath,
      href: node.url,
      text: node.alt ?? '[image]',
      line,
      type: classifyLink(node.url),
    });
  }

  // Extract title from first heading
  const headings = walkTree<Heading>(tree, 'heading');
  const h1 = headings.find((h) => h.depth === 1);
  const title = h1 ? mdastToString(h1) : null;

  return {
    filePath,
    title,
    rawContent: content,
    codeBlocks,
    links,
  };
}
