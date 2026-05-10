import { Terminal, Search, Link2, Brain, GitPullRequest, Plug } from 'lucide-react';
import { FadeIn } from './fade-in';
import { CTA } from './cta';

const features = [
  {
    icon: Terminal,
    label: '01 / Code Validation',
    title: 'Every JS example, actually executed',
    description:
      'zivodoc extracts every code block from your docs and runs JavaScript examples in an isolated WASM sandbox to catch ReferenceError, TypeError, and runtime crashes. JS, TypeScript, JSON, and YAML blocks are also syntax-checked. Broken imports and undefined references are flagged before your users hit them.',
    bullets: [
      'JavaScript runtime execution via QuickJS WASM',
      'Smart skip heuristics so snippet blocks don’t false-positive',
      'JS and TypeScript syntax checking',
      'JSON and YAML structural validation',
      'Per-block error context with file path and line number',
      '@zivodoc-skip annotation to opt a block out',
    ],
    code: `$ zivodoc validate

Validating 423 code blocks...
  JavaScript runtime  267 ran, 12 runtime errors
  JS/TS syntax        389 parsed, 4 syntax errors
  JSON                36 parsed, 2 invalid
  YAML                18 parsed, 1 invalid

Results: 19 broken examples across 8 pages.`,
  },
  {
    icon: Search,
    label: '02 / API Validation',
    title: 'Docs vs spec, always in sync',
    description:
      'Point zivodoc at your OpenAPI spec and it compares every API reference in your docs against the actual definition. Required params marked optional, missing response fields, outdated schemas — all caught automatically. Works with OpenAPI 3.0, 3.1, and Swagger 2.0.',
    bullets: [
      'Compare docs against OpenAPI/Swagger specs',
      'Detect parameter mismatches (required, optional, type)',
      'Validate response schemas against documented examples',
      'Catch missing or renamed endpoints',
      'Support for OpenAPI 3.0, 3.1, and Swagger 2.0',
      'Inline diff showing exactly what diverged',
    ],
    code: `$ zivodoc validate --openapi spec.yaml

Comparing docs against OpenAPI spec...

  /v1/charges POST  — docs show amount as optional (spec: required)
  /v1/refunds GET   — docs missing payment_intent param
  /v1/tokens  POST  — response schema outdated (missing livemode)

Found 14 mismatches across 189 endpoints.`,
  },
  {
    icon: Link2,
    label: '03 / Link Checking',
    title: 'Zero dead links, zero broken anchors',
    description:
      'Every internal link, external URL, and anchor reference is validated. Pages that got renamed, sections that moved, external resources that disappeared — zivodoc finds them all. Runs fast with concurrent checks and respects rate limits on external sites.',
    bullets: [
      'Internal and external link validation',
      'Anchor/fragment checking within pages',
      'Redirect chain detection (301, 302)',
      'Rate-limited external checks to avoid blocks',
      'Concurrent checking for fast scan times',
      'Grouped results by page for easy fixing',
    ],
    code: `$ zivodoc check-links

Checking 2,341 links across 1,847 pages...

  BROKEN   /guides/auth.md → /api/tokens (404)
  BROKEN   /guides/webhooks.md → stripe.com/old-page (404)
  REDIRECT /api/charges.md → /v1/charges (301 chain)
  ANCHOR   /guides/errors.md#retry-logic (anchor missing)

Found 23 broken links, 8 redirect chains, 4 missing anchors.`,
  },
  {
    icon: Brain,
    label: '04 / Secrets & Quality',
    title: 'The small stuff, caught before users see it',
    description:
      'zivodoc scans every page for leaked credentials, internal-only URLs, missing alt text, broken images, heading-level skips, multiple H1s, empty sections, TODO markers, and placeholder text. The kind of issues that quietly erode docs trust over time.',
    bullets: [
      'Pattern-based secret detection (API keys, JWTs, AWS, Stripe)',
      'Internal-only URLs slipped into public docs',
      'Missing alt text and broken image references',
      'Heading hierarchy issues (skips, multiple H1s, empty sections)',
      'TODO and placeholder text left behind',
      'Stale dates and outdated copy markers',
    ],
    code: `$ zivodoc scan

Scanning content quality...

  [SECRET]    /guides/setup.md:42  → AWS access key pattern
  [HEADING]   /api/auth.md:18      → H2 → H4 (skipped H3)
  [ALT]       /guides/quickstart   → 3 images missing alt text
  [TODO]      /api/errors.md:91    → "TODO: document error codes"
  [INTERNAL]  /guides/deploy.md    → links to staging.internal

12 hygiene issues across 7 pages.`,
  },
  {
    icon: GitPullRequest,
    label: '05 / PR Checks & Comments',
    title: 'Docs reviews, where code reviews happen',
    description:
      'Install the zivodoc GitHub App on your repo. Every push to a PR runs a scan and posts a check status — broken docs block the merge, just like failing tests. A sticky comment on the PR lists every finding with file path, line number, and severity, so your team reviews docs the same way they review code.',
    bullets: [
      'GitHub App with check status (pass / fail) on every PR',
      'Sticky PR comment listing all findings with file:line context',
      'Configurable severity threshold for blocking merges',
      'Updates in place on subsequent pushes — no comment spam',
      'Works for public and private repos',
      'Deep link from each finding back to the scan report',
    ],
    code: `# zivodoc on PR #284
✓  No errors blocking merge.

Check: zivodoc/scan       Status: success (warnings only)

  [warn]  /guides/auth.md:42       broken anchor → #retry-logic
  [warn]  /api/tokens.md:18        stale SDK version reference
  [warn]  /guides/setup.md:91      broken external link

3 warnings · 0 errors · view full report → app.zivodoc.com`,
  },
  {
    icon: Plug,
    label: '06 / CI Integration',
    title: 'One line in your CI, always watching',
    description:
      'Add zivodoc to your CI pipeline with a single step. Runs on every push, every PR, or on a schedule. Results appear in your PR checks — broken docs block the merge, just like failing tests. Continuous monitoring means docs never drift again.',
    bullets: [
      'GitHub Action and CLI for any CI provider',
      'PR check integration (pass / fail on error severity)',
      'Scheduled scans (daily / weekly / manual)',
      'Sticky PR comment with inline finding context',
      'Dashboard for historical scan trends',
      'CSV export of findings for downstream tooling',
    ],
    code: `# .ci/docs-qa.yml
name: Docs QA
on: [push, pull_request]
steps:
  - name: Scan docs
    run: npx zivodoc scan
      --docs-path ./docs
      --openapi-spec ./openapi.yaml
      --auto-pr`,
  },
];

export default function FeaturesContent() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-surface">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              Features
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[76px] font-semibold leading-[1.02] tracking-[-0.04em] max-w-[900px]">
              Every way your docs can break.{' '}
              <span className="text-ink-secondary">Caught automatically.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-8 text-[17px] sm:text-[19px] leading-[1.55] text-ink-secondary max-w-[560px]">
              Six layers of automated docs QA — code execution, API validation, link checking,
              hygiene scans, GitHub PR integration, and CI gating.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Feature sections — alternating subtle dark shades */}
      {features.map((feature, i) => {
        const Icon = feature.icon;
        const isAlt = i % 2 === 1;
        const isReverse = i % 2 === 1;
        return (
          <section
            key={feature.title}
            className={`${isAlt ? 'bg-surface-alt' : 'bg-surface'} border-t border-line`}
          >
            <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-24 sm:py-32">
              <div
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start ${isReverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                {/* Left — text */}
                <div>
                  <FadeIn>
                    <div className="flex size-12 items-center justify-center bg-surface-elevated mb-8">
                      <Icon className="size-5 text-ink-secondary" strokeWidth={1.5} />
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.05}>
                    <p className="font-label text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted mb-5">
                      {feature.label}
                    </p>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <h2 className="text-[32px] sm:text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] mb-6 text-ink">
                      {feature.title}
                    </h2>
                  </FadeIn>
                  <FadeIn delay={0.15}>
                    <p className="text-[15px] leading-[1.7] mb-8 max-w-[500px] text-ink-secondary">
                      {feature.description}
                    </p>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <ul className="flex flex-col gap-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <span className="mt-2 size-1 rounded-full shrink-0 bg-ink-muted" />
                          <span className="text-[14px] text-ink-secondary">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </FadeIn>
                </div>

                {/* Right — code snippet */}
                <FadeIn delay={0.2}>
                  <div className="p-8 lg:p-10 font-mono text-[12px] leading-[1.7] border border-line bg-surface-card text-ink-secondary">
                    <pre className="whitespace-pre-wrap break-words">
                      <code>{feature.code}</code>
                    </pre>
                  </div>
                </FadeIn>
              </div>
            </div>
          </section>
        );
      })}

      <CTA />
    </main>
  );
}
