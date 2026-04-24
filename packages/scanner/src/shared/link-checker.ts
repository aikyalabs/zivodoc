import type { PageLink, LinkCheckResult, Finding } from '../types.js';
import {
  brokenLinkFinding,
  redirectChainFinding,
  slowLinkFinding,
  timeoutFinding,
  insecureLinkFinding,
} from './finding-builder.js';

const CONCURRENCY = 5;
const TIMEOUT_MS = 10_000;
const SLOW_THRESHOLD_MS = 5_000;
const MAX_REDIRECT_HOPS = 2;
const PLAYWRIGHT_TIMEOUT_MS = 15_000;

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * HTTP status codes that indicate bot blocking, not a real broken link.
 * These sites work fine in a browser but reject automated requests.
 */
const BOT_BLOCKED_STATUSES = new Set([403, 405, 406, 429, 999]);

interface CheckResultInternal extends LinkCheckResult {
  verified: boolean;
}

function isHttpUrl(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

function isLocalUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase();
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

const EXAMPLE_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'mysite.com',
  'my.store.com',
  'your-site.com',
  'yoursite.com',
  'yourdomain.com',
  'your-domain.com',
  'yourcompany.com',
  'mycompany.com',
  'test.com',
]);

function isExampleUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.toLowerCase();
    return (
      EXAMPLE_DOMAINS.has(host) ||
      host.endsWith('.test') ||
      host.endsWith('.example') ||
      host.endsWith('.example.com') ||
      host.endsWith('.example.org') ||
      host.endsWith('.invalid') ||
      // Punycode/IDN trick domains used in phishing examples
      host.startsWith('xn--')
    );
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  url: string,
  method: 'HEAD' | 'GET',
  timeoutMs: number,
  userAgent?: string,
): Promise<{ response: Response; elapsedMs: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();

  const headers: Record<string, string> = {};
  if (userAgent) headers['User-Agent'] = userAgent;

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      redirect: 'follow',
      headers,
    });
    clearTimeout(timer);
    return { response, elapsedMs: Date.now() - start };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function httpCheck(
  href: string,
): Promise<{ status: number; elapsedMs: number; redirected: boolean; finalUrl: string }> {
  try {
    const { response, elapsedMs } = await fetchWithTimeout(href, 'HEAD', TIMEOUT_MS, BROWSER_UA);
    if (response.status < 400 || BOT_BLOCKED_STATUSES.has(response.status)) {
      return {
        status: response.status,
        elapsedMs,
        redirected: response.redirected,
        finalUrl: response.url,
      };
    }
  } catch {}

  try {
    const { response, elapsedMs } = await fetchWithTimeout(href, 'GET', TIMEOUT_MS, BROWSER_UA);
    return {
      status: response.status,
      elapsedMs,
      redirected: response.redirected,
      finalUrl: response.url,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 0, elapsedMs: TIMEOUT_MS, redirected: false, finalUrl: href };
    }
    return { status: 0, elapsedMs: 0, redirected: false, finalUrl: href };
  }
}

let playwrightBrowser: import('playwright').Browser | null = null;
let playwrightUnavailable = false;

async function getPlaywrightBrowser(): Promise<import('playwright').Browser | null> {
  if (playwrightUnavailable) return null;
  if (playwrightBrowser?.isConnected()) return playwrightBrowser;

  try {
    const { chromium } = await import('playwright');
    playwrightBrowser = await chromium.launch({ headless: true });
    return playwrightBrowser;
  } catch {
    playwrightUnavailable = true;
    return null;
  }
}

/**
 * Verify a URL with a real browser. Used as a last resort for links
 * that return 4xx to fetch() but might work in a browser (JS-rendered SPAs).
 * Returns the final HTTP status observed by the browser.
 */
async function playwrightCheck(href: string): Promise<{ status: number; elapsedMs: number }> {
  const start = Date.now();
  try {
    const browser = await getPlaywrightBrowser();
    if (!browser) return { status: 0, elapsedMs: 0 };
    const context = await browser.newContext({ userAgent: BROWSER_UA });
    const page = await context.newPage();

    const response = await page.goto(href, {
      waitUntil: 'domcontentloaded',
      timeout: PLAYWRIGHT_TIMEOUT_MS,
    });

    const httpStatus = response?.status() ?? 0;

    // Some SPAs return 4xx HTTP status but render valid content via client-side routing.
    // We need to distinguish "real 404 with custom error page" from "SPA that works fine".
    if (httpStatus >= 400) {
      const pageSignals = await page.evaluate(() => {
        const title = document.title?.toLowerCase() ?? '';
        const h1 = document.querySelector('h1')?.textContent?.toLowerCase() ?? '';
        const bodyLength = document.body?.innerText?.length ?? 0;
        const finalUrl = window.location.href;
        return { title, h1, bodyLength, finalUrl };
      });

      const has404Indicator =
        pageSignals.title.includes('404') ||
        pageSignals.title.includes('not found') ||
        pageSignals.h1.includes('404') ||
        pageSignals.h1.includes('not found') ||
        pageSignals.h1.includes('page not found');

      // SPA with content + no 404 indicators = page works, just wrong HTTP status
      if (pageSignals.bodyLength > 200 && !has404Indicator) {
        await context.close();
        return { status: 200, elapsedMs: Date.now() - start };
      }
    }

    await context.close();
    return { status: httpStatus, elapsedMs: Date.now() - start };
  } catch {
    return { status: 0, elapsedMs: Date.now() - start };
  }
}

export async function closeBrowser(): Promise<void> {
  if (playwrightBrowser) {
    await playwrightBrowser.close().catch(() => {});
    playwrightBrowser = null;
  }
}

async function countRedirectHops(url: string): Promise<{ hops: number; chain: string[] }> {
  let hops = 0;
  let currentUrl = url;
  const chain: string[] = [url];

  for (;;) {
    if (hops > 10) break;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      const response = await fetch(currentUrl, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': BROWSER_UA },
      });
      clearTimeout(timer);

      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        hops++;
        const location = response.headers.get('location')!;
        currentUrl = new URL(location, currentUrl).href;
        chain.push(currentUrl);
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  return { hops, chain };
}

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

export async function checkLinks(
  links: PageLink[],
): Promise<{ results: LinkCheckResult[]; findings: Finding[] }> {
  const findings: Finding[] = [];
  const checkable: PageLink[] = [];

  for (const link of links) {
    if (link.type !== 'external') continue;

    if (!isHttpUrl(link.href)) continue;
    if (isLocalUrl(link.href) || isExampleUrl(link.href)) continue;

    checkable.push(link);
  }

  const seen = new Map<string, PageLink>();
  for (const link of checkable) {
    if (!seen.has(link.href)) seen.set(link.href, link);
  }
  const uniqueLinks = Array.from(seen.values());

  const httpResults = await processBatch(
    uniqueLinks,
    CONCURRENCY,
    async (link): Promise<CheckResultInternal> => {
      const result = await httpCheck(link.href);

      if (result.status === 0) {
        return { link, status: 'timeout', responseTimeMs: result.elapsedMs, verified: false };
      }

      if (BOT_BLOCKED_STATUSES.has(result.status)) {
        return {
          link,
          status: 'ok',
          httpStatus: result.status,
          responseTimeMs: result.elapsedMs,
          verified: true,
        };
      }

      if (result.redirected && result.finalUrl !== link.href) {
        const { hops, chain } = await countRedirectHops(link.href);
        if (hops > MAX_REDIRECT_HOPS) {
          return {
            link,
            status: 'redirect',
            httpStatus: result.status,
            redirectUrl: result.finalUrl,
            redirectChain: chain,
            responseTimeMs: result.elapsedMs,
            verified: true,
          };
        }
      }

      if (result.status >= 400) {
        return {
          link,
          status: 'broken',
          httpStatus: result.status,
          responseTimeMs: result.elapsedMs,
          verified: false,
        };
      }

      return {
        link,
        status: 'ok',
        httpStatus: result.status,
        responseTimeMs: result.elapsedMs,
        verified: true,
      };
    },
  );

  // Broken links need browser verification — JS-rendered SPAs return 404 to fetch
  const failedLinks = httpResults.filter((r) => r.status === 'broken' && !r.verified);

  if (failedLinks.length > 0) {
    await processBatch(failedLinks, 3, async (result) => {
      const { status } = await playwrightCheck(result.link.href);

      if (status >= 200 && status < 400) {
        result.status = 'ok';
        result.httpStatus = status;
        result.verified = true;
      } else {
        result.verified = true;
      }
    });

    await closeBrowser();
  }

  const reported = new Set<string>();

  for (const result of httpResults) {
    const href = result.link.href;
    if (reported.has(href)) continue;
    reported.add(href);

    switch (result.status) {
      case 'broken':
        findings.push(
          brokenLinkFinding(
            result.link.source,
            result.link.line,
            href,
            result.httpStatus,
            result.responseTimeMs,
          ),
        );
        break;
      case 'redirect':
        findings.push(
          redirectChainFinding(
            result.link.source,
            result.link.line,
            href,
            result.redirectChain ?? [result.redirectUrl ?? href],
          ),
        );
        break;
      case 'timeout':
        findings.push(
          timeoutFinding(result.link.source, result.link.line, href, result.responseTimeMs),
        );
        break;
      case 'ok':
        if (result.responseTimeMs && result.responseTimeMs > SLOW_THRESHOLD_MS) {
          findings.push(
            slowLinkFinding(result.link.source, result.link.line, href, result.responseTimeMs),
          );
        }
        break;
    }

    if (href.startsWith('http://') && !isLocalUrl(href)) {
      findings.push(insecureLinkFinding(result.link.source, result.link.line, href));
    }
  }

  const results: LinkCheckResult[] = httpResults.map(
    ({ link, status, httpStatus, redirectUrl, redirectChain, responseTimeMs }) => ({
      link,
      status,
      httpStatus,
      redirectUrl,
      redirectChain,
      responseTimeMs,
    }),
  );

  return { results, findings };
}
