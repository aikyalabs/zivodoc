import * as acorn from 'acorn';
import * as cheerio from 'cheerio';
import yaml from 'js-yaml';

import type { Finding, ScannedPage } from '../types.js';
import {
  missingEndpointFinding,
  undocumentedEndpointFinding,
  wrongHttpMethodFinding,
} from '../shared/finding-builder.js';

export interface SpecEndpoint {
  method: string;
  path: string;
}

export interface DocEndpointReference {
  method: string;
  path: string;
  source: string;
  line: number;
  context: string;
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
const METHOD_REGEX = new RegExp(`\\b(${HTTP_METHODS.join('|')})\\s+(\\/[\\w/\\-{}:.\\[\\]]+)`, 'g');
const CURL_REGEX =
  /curl\s+(?:-X\s+)?(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)?[^\n]*?https?:\/\/[^\s/]+(\/[\w/\-{}:.\[\]]+)/gi;

const COMMON_SPEC_PATHS = [
  '/openapi.json',
  '/openapi.yaml',
  '/openapi.yml',
  '/swagger.json',
  '/swagger.yaml',
  '/swagger.yml',
  '/v2/api-docs',
  '/v3/api-docs',
  '/api-docs',
  '/api/openapi.json',
  '/api/swagger.json',
  '/docs/openapi.json',
  '/docs/swagger.json',
];

function isSpecObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return ('openapi' in obj || 'swagger' in obj) && 'paths' in obj && typeof obj.paths === 'object';
}

function tryParse(text: string): unknown {
  const trimmed = text.trim();
  try {
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return JSON.parse(trimmed);
    }
    return yaml.load(trimmed);
  } catch {
    return null;
  }
}

const SPEC_URL_KEYS = new Set(['url', 'specUrl', 'apiDescriptionUrl', 'specurl']);
const SPEC_URL_ATTRIBUTES = ['spec-url', 'data-spec-url', 'apiDescriptionUrl', 'spec', 'data-spec'];

function resolveUrl(candidate: string, baseUrl: string): string | null {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function findSpecUrlInAst(node: acorn.Node): string | null {
  let found: string | null = null;
  const visit = (n: unknown): void => {
    if (found || !n || typeof n !== 'object') return;
    const node = n as { type?: string; [key: string]: unknown };

    if (node.type === 'Property') {
      const key = node.key as { type?: string; name?: string; value?: string } | undefined;
      const keyName = key?.name ?? key?.value;
      const value = node.value as { type?: string; value?: unknown } | undefined;
      if (
        keyName != null &&
        SPEC_URL_KEYS.has(keyName) &&
        value?.type === 'Literal' &&
        typeof value.value === 'string'
      ) {
        found = value.value;
        return;
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
      const child = node[key];
      if (Array.isArray(child)) child.forEach(visit);
      else if (child && typeof child === 'object') visit(child);
    }
  };
  visit(node);
  return found;
}

function extractSpecUrlFromScripts($: cheerio.CheerioAPI): string | null {
  const scripts = $('script:not([src])').toArray();
  for (const script of scripts) {
    const code = $(script).text();
    if (!code.trim()) continue;
    if (!/url|spec/i.test(code)) continue;
    try {
      const ast = acorn.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
      });
      const url = findSpecUrlInAst(ast);
      if (url) return url;
    } catch {
      continue;
    }
  }
  return null;
}

function extractSpecUrlFromHtml(html: string, baseUrl: string): string | null {
  const $ = cheerio.load(html);

  for (const attr of SPEC_URL_ATTRIBUTES) {
    const found = $(`[${attr}]`).first().attr(attr);
    if (found) {
      const resolved = resolveUrl(found, baseUrl);
      if (resolved) return resolved;
    }
  }

  const scriptUrl = extractSpecUrlFromScripts($);
  if (scriptUrl) {
    return resolveUrl(scriptUrl, baseUrl);
  }

  return null;
}

async function fetchOnce(url: string): Promise<{ text: string; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json, application/yaml, text/yaml, text/html, */*' },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!response.ok) return null;
    const text = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    return { text, contentType };
  } catch {
    return null;
  }
}

export async function fetchAndParseSpec(specUrl: string): Promise<unknown> {
  const direct = await fetchOnce(specUrl);
  if (direct) {
    const parsed = tryParse(direct.text);
    if (isSpecObject(parsed)) return parsed;

    const looksLikeHtml =
      direct.contentType.includes('html') || direct.text.trim().toLowerCase().startsWith('<');
    if (looksLikeHtml) {
      const embedded = extractSpecUrlFromHtml(direct.text, specUrl);
      if (embedded) {
        const inner = await fetchOnce(embedded);
        if (inner) {
          const innerParsed = tryParse(inner.text);
          if (isSpecObject(innerParsed)) return innerParsed;
        }
      }
    }
  }

  const base = new URL(specUrl);
  for (const path of COMMON_SPEC_PATHS) {
    const candidate = new URL(path, base).toString();
    if (candidate === specUrl) continue;
    const result = await fetchOnce(candidate);
    if (!result) continue;
    const parsed = tryParse(result.text);
    if (isSpecObject(parsed)) return parsed;
  }

  throw new Error(
    `Could not locate an OpenAPI spec at ${specUrl} or any common discovery path. Provide the direct URL to a swagger.json / openapi.yaml file.`,
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function extractSpecEndpoints(spec: unknown): SpecEndpoint[] {
  if (!isObject(spec)) return [];
  const paths = spec.paths;
  if (!isObject(paths)) return [];

  const endpoints: SpecEndpoint[] = [];
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!isObject(pathItem)) continue;
    for (const method of HTTP_METHODS) {
      const lower = method.toLowerCase();
      if (lower in pathItem && isObject(pathItem[lower])) {
        endpoints.push({ method, path: pathKey });
      }
    }
  }
  return endpoints;
}

export function normalizePath(path: string): string {
  return path
    .replace(/\{[^}]+\}/g, '{*}')
    .replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '{*}')
    .replace(/\/+$/, '')
    .toLowerCase();
}

function pathMatchesTemplate(actualPath: string, templatePath: string): boolean {
  const a = normalizePath(actualPath);
  const t = normalizePath(templatePath);
  if (a === t) return true;
  const aParts = a.split('/');
  const tParts = t.split('/');
  if (aParts.length !== tParts.length) return false;
  return tParts.every((part, i) => part === '{*}' || part === aParts[i]);
}

export function extractDocEndpointReferences(pages: ScannedPage[]): DocEndpointReference[] {
  const refs: DocEndpointReference[] = [];

  for (const page of pages) {
    const source = page.url ?? page.filePath ?? '';
    const content = page.rawContent ?? '';

    if (content) {
      collectFromText(content, source, refs);
    }

    for (const block of page.codeBlocks) {
      collectFromText(block.code, source, refs, block.lineStart);
    }
  }

  return refs;
}

function collectFromText(
  text: string,
  source: string,
  out: DocEndpointReference[],
  lineOffset = 0,
): void {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = lineOffset + i + 1;

    for (const match of line.matchAll(METHOD_REGEX)) {
      const method = match[1].toUpperCase();
      const path = match[2];
      if (isLikelyApiPath(path)) {
        out.push({ method, path, source, line: lineNum, context: line.trim() });
      }
    }

    for (const match of line.matchAll(CURL_REGEX)) {
      const method = (match[1] ?? 'GET').toUpperCase();
      const path = match[2];
      if (isLikelyApiPath(path)) {
        out.push({ method, path, source, line: lineNum, context: line.trim() });
      }
    }
  }
}

function isLikelyApiPath(path: string): boolean {
  if (path.length < 2) return false;
  const lower = path.toLowerCase();
  const skipPrefixes = [
    '/docs',
    '/blog',
    '/static',
    '/assets',
    '/images',
    '/img',
    '/css',
    '/js',
    '/_next',
    '/about',
    '/contact',
    '/pricing',
    '/privacy',
    '/terms',
  ];
  if (skipPrefixes.some((p) => lower === p || lower.startsWith(p + '/'))) return false;
  if (/\.(html?|css|js|png|jpe?g|svg|ico|md|pdf)$/i.test(path)) return false;
  return true;
}

export function validateOpenApi(
  spec: unknown,
  pages: ScannedPage[],
  specSource: string,
): Finding[] {
  const findings: Finding[] = [];
  const specEndpoints = extractSpecEndpoints(spec);
  if (specEndpoints.length === 0) return findings;

  const docRefs = extractDocEndpointReferences(pages);

  for (const endpoint of specEndpoints) {
    const documented = docRefs.some(
      (ref) => ref.method === endpoint.method && pathMatchesTemplate(ref.path, endpoint.path),
    );
    if (!documented) {
      findings.push(missingEndpointFinding(specSource, endpoint.method, endpoint.path));
    }
  }

  const seenWrongMethod = new Set<string>();
  for (const ref of docRefs) {
    const matchingPathEndpoints = specEndpoints.filter((e) =>
      pathMatchesTemplate(ref.path, e.path),
    );

    if (matchingPathEndpoints.length === 0) {
      findings.push(
        undocumentedEndpointFinding(ref.source, ref.line, ref.method, ref.path, ref.context),
      );
      continue;
    }

    const methodMatch = matchingPathEndpoints.some((e) => e.method === ref.method);
    if (!methodMatch) {
      const key = `${ref.source}|${ref.line}|${ref.path}`;
      if (seenWrongMethod.has(key)) continue;
      seenWrongMethod.add(key);
      findings.push(
        wrongHttpMethodFinding(
          ref.source,
          ref.line,
          ref.path,
          ref.method,
          matchingPathEndpoints.map((e) => e.method),
          ref.context,
        ),
      );
    }
  }

  return findings;
}
