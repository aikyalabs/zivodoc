import { Terminal, Search, Link2, Brain, GitPullRequest, Plug } from 'lucide-react';
import { FadeIn } from './fade-in';
import { CTA } from './cta';

const features = [
  {
    icon: Terminal,
    label: '01 / Code Execution',
    title: 'Every code example, actually tested',
    description:
      'zivodoc extracts every code block from your docs and executes them in isolated sandboxes. Node.js, Python, Go, Ruby, cURL — each example runs in the right environment with the right dependencies. Broken imports, deprecated APIs, and wrong output are caught before your users hit them.',
    bullets: [
      'Multi-language sandbox execution (Node.js, Python, Go, Ruby, shell)',
      'Automatic dependency detection and installation',
      'Output verification against documented expectations',
      'Version pinning to match your documented SDK versions',
      'Parallel execution for fast scan times',
      'Detailed failure reports with line-level context',
    ],
    code: `$ zivodoc validate --execute

Spinning up sandboxes...
  [Node.js 20]  Running 287 JavaScript examples
  [Python 3.12] Running 98 Python examples
  [cURL]        Running 38 shell examples

Results: 391/423 passed, 32 failed
  12 import errors, 8 deprecated APIs, 12 wrong output`,
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
    label: '04 / AI Analysis',
    title: 'Contradictions and confusion, detected',
    description:
      "AI reads your docs the way a developer would — and flags what doesn't make sense. Pages that contradict each other, outdated version references, confusing explanations, and content that drifted from your actual codebase. Not just syntax checking — semantic understanding.",
    bullets: [
      'Cross-page contradiction detection',
      'Outdated version and SDK reference flagging',
      'Confusing or ambiguous content identification',
      'Content drift detection against source code',
      'Tone and consistency analysis',
      'Suggested rewrites for flagged content',
    ],
    code: `$ zivodoc detect --ai

Analyzing content for contradictions...

  [CONTRADICTION] /guides/auth.md says "tokens expire in 1h"
                  /api/tokens.md says "tokens expire in 24h"
  [STALE]         /guides/quickstart.md references SDK v2
                  Latest SDK version is v4.2.1
  [CONFUSING]     /api/errors.md — 3 different error formats shown`,
  },
  {
    icon: GitPullRequest,
    label: '05 / Auto-Fix PRs',
    title: 'Fixes generated, PRs opened',
    description:
      "zivodoc doesn't just report problems — it fixes them. Broken imports get corrected, stale references get updated, dead links get replaced. Each fix is a clean PR with context explaining what broke and why, ready for your team to review and merge.",
    bullets: [
      'Automatic PR generation for each category of fix',
      'Clean diffs with context explaining the change',
      'Grouped by severity (critical, warning, info)',
      'Respects your branch naming conventions',
      'Links back to the scan report for full context',
      'Configurable auto-merge for low-risk fixes',
    ],
    code: `$ zivodoc fix --auto-pr

Generating fixes...
  PR #142: Fix 12 broken import statements in /guides/
  PR #143: Update API response schemas to match OpenAPI spec
  PR #144: Fix dead links in /api/ (7 links)
  PR #145: Update SDK version references v2 → v4.2.1

Opened 4 PRs on your-org/your-docs. Review in your dashboard.`,
  },
  {
    icon: Plug,
    label: '06 / CI Integration',
    title: 'One line in your CI, always watching',
    description:
      'Add zivodoc to your CI pipeline with a single step. Runs on every push, every PR, or on a schedule. Results appear in your PR checks — broken docs block the merge, just like failing tests. Continuous monitoring means docs never drift again.',
    bullets: [
      'One-line CI setup (any provider)',
      'PR check integration (pass/fail)',
      'Scheduled scans (daily, weekly, on-push)',
      'Results as PR comments with inline annotations',
      'Dashboard for historical scan trends',
      'Slack/Discord notifications for new issues',
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
              Six layers of automated docs QA — from code execution to AI analysis. Continuous
              monitoring with automatic fixes.
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
