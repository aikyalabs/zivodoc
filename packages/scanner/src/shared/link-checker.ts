import type { PageLink, LinkCheckResult, Finding } from '../types.js';
import {
  brokenLinkFinding,
  redirectChainFinding,
  slowLinkFinding,
  timeoutFinding,
} from './finding-builder.js';

const CONCURRENCY = 10;
const TIMEOUT_MS = 10_000;
const SLOW_THRESHOLD_MS = 5_000;
const MAX_REDIRECT_HOPS = 2;

interface CheckResultInternal extends LinkCheckResult {
  elapsedMs: number;
}

async function checkSingleLink(link: PageLink): Promise<CheckResultInternal> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    // Try HEAD first, fall back to GET if HEAD fails
    let response: Response;
    try {
      response = await fetch(link.href, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
      });
    } catch {
      response = await fetch(link.href, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      });
    }

    clearTimeout(timer);
    const elapsedMs = Date.now() - start;
    const status = response.status;

    // Check for redirect chains by making a manual follow
    if (response.redirected && response.url !== link.href) {
      const hopsResult = await countRedirectHops(link.href);
      if (hopsResult.hops > MAX_REDIRECT_HOPS) {
        return {
          link,
          status: 'redirect',
          httpStatus: status,
          redirectUrl: response.url,
          elapsedMs,
        };
      }
    }

    // 403 is often rate limiting/bot blocking, not truly broken
    if (status === 403) {
      return { link, status: 'ok', httpStatus: status, elapsedMs };
    }

    if (status >= 400) {
      return { link, status: 'broken', httpStatus: status, elapsedMs };
    }

    return { link, status: 'ok', httpStatus: status, elapsedMs };
  } catch (err) {
    clearTimeout(timer);
    const elapsedMs = Date.now() - start;
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { link, status: 'timeout', elapsedMs };
    }
    return { link, status: 'broken', elapsedMs };
  }
}

async function countRedirectHops(url: string): Promise<{ hops: number; finalUrl: string }> {
  let hops = 0;
  let currentUrl = url;

  for (;;) {
    if (hops > 10) break; // Safety limit

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
      });
      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        hops++;
        const location = response.headers.get('location')!;
        currentUrl = new URL(location, currentUrl).href;
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return { hops, finalUrl: currentUrl };
}

/**
 * Process items in batches with a concurrency limit.
 */
async function processBatch<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = fn(item).then((result) => {
      results.push(result);
    });
    const wrapped = p.then(() => {
      executing.delete(wrapped);
    });
    executing.add(wrapped);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

function isLocalUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local')
    );
  } catch {
    return false;
  }
}

function isExampleUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.toLowerCase();
    return (
      host.endsWith('.test') ||
      host.endsWith('.example') ||
      host === 'example.com' ||
      host.endsWith('.example.com')
    );
  } catch {
    return false;
  }
}

export async function checkLinks(
  links: PageLink[],
): Promise<{ results: LinkCheckResult[]; findings: Finding[] }> {
  // Separate local/example URLs — flag them as info, don't HTTP check them
  const findings: Finding[] = [];
  const checkableLinks: PageLink[] = [];

  for (const link of links) {
    if (link.type !== 'external') continue;

    if (isLocalUrl(link.href)) {
      findings.push({
        category: 'stale_ref',
        severity: 'info',
        source: link.source,
        line: link.line,
        title: `Local URL reference: ${link.href}`,
        description: `Documentation references a local URL (${link.href}). This may be intentional (example code) or an accidental dev URL that should be replaced with a production URL.`,
        rawData: { href: link.href, type: 'local_url' },
      });
      continue;
    }

    if (isExampleUrl(link.href)) {
      // example.com URLs are intentional placeholders — skip silently
      continue;
    }

    checkableLinks.push(link);
  }

  // Deduplicate by href
  const seen = new Map<string, PageLink>();
  for (const link of checkableLinks) {
    if (!seen.has(link.href)) {
      seen.set(link.href, link);
    }
  }
  const uniqueLinks = Array.from(seen.values());

  const internalResults = await processBatch(uniqueLinks, CONCURRENCY, checkSingleLink);

  // Build a map from href to result for lookup
  const resultMap = new Map<string, CheckResultInternal>();
  for (const r of internalResults) {
    resultMap.set(r.link.href, r);
  }

  // Generate findings from HTTP checks (one per unique href)
  const reportedHrefs = new Set<string>();

  for (const link of checkableLinks) {
    if (reportedHrefs.has(link.href)) continue;
    reportedHrefs.add(link.href);

    const result = resultMap.get(link.href);
    if (!result) continue;

    switch (result.status) {
      case 'broken':
        findings.push(brokenLinkFinding(link.source, link.line, link.href, result.httpStatus));
        break;
      case 'redirect':
        findings.push(
          redirectChainFinding(link.source, link.line, link.href, result.redirectUrl ?? link.href),
        );
        break;
      case 'timeout':
        findings.push(timeoutFinding(link.source, link.line, link.href));
        break;
      case 'ok':
        if (result.elapsedMs > SLOW_THRESHOLD_MS) {
          findings.push(slowLinkFinding(link.source, link.line, link.href, result.elapsedMs));
        }
        break;
    }
  }

  // Convert internal results to public LinkCheckResult (strip elapsedMs)
  const results: LinkCheckResult[] = internalResults.map(
    ({ link, status, httpStatus, redirectUrl }) => ({
      link,
      status,
      httpStatus,
      redirectUrl,
    }),
  );

  return { results, findings };
}
