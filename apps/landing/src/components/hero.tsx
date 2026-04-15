import { useState } from 'react';
import { motion } from 'framer-motion';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

type TabKey = 'scan' | 'execute' | 'validate' | 'detect' | 'fix';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'scan', label: 'Crawl' },
  { key: 'execute', label: 'Execute' },
  { key: 'validate', label: 'Validate' },
  { key: 'detect', label: 'Detect' },
  { key: 'fix', label: 'Fix' },
];

const tabPreviews: Record<TabKey, { title: string; code: string[] }> = {
  scan: {
    title: 'zivodoc scan --repo stripe/stripe-docs',
    code: [
      '$ zivodoc scan --repo stripe/stripe-docs',
      '',
      'Crawling docs site... found 1,847 pages',
      'Extracting code blocks... found 423 examples',
      'Extracting API references... found 189 endpoints',
      'Checking links... found 2,341 links',
      '',
      'Ready to validate. Run `zivodoc validate` to continue.',
    ],
  },
  execute: {
    title: 'zivodoc validate --execute',
    code: [
      '$ zivodoc validate --execute',
      '',
      'Spinning up sandboxes...',
      '  [Node.js 20]  Running 287 JavaScript examples',
      '  [Python 3.12] Running 98 Python examples',
      '  [cURL]        Running 38 shell examples',
      '',
      'Results: 391/423 passed, 32 failed',
      '  12 import errors, 8 deprecated APIs, 12 wrong output',
    ],
  },
  validate: {
    title: 'zivodoc validate --openapi spec.yaml',
    code: [
      '$ zivodoc validate --openapi spec.yaml',
      '',
      'Comparing docs against OpenAPI spec...',
      '',
      '  /v1/charges POST  — docs show `amount` as optional (spec: required)',
      '  /v1/refunds GET   — docs missing `payment_intent` param',
      '  /v1/tokens  POST  — response schema outdated (missing `livemode`)',
      '',
      'Found 14 mismatches across 189 endpoints.',
    ],
  },
  detect: {
    title: 'zivodoc detect --ai',
    code: [
      '$ zivodoc detect --ai',
      '',
      'Analyzing content for contradictions...',
      '',
      '  [CONTRADICTION] /guides/auth.md says "tokens expire in 1h"',
      '                  /api/tokens.md says "tokens expire in 24h"',
      '  [STALE]         /guides/quickstart.md references SDK v2',
      '                  Latest SDK version is v4.2.1',
      '  [CONFUSING]     /api/errors.md — 3 different error formats shown',
    ],
  },
  fix: {
    title: 'zivodoc fix --auto-pr',
    code: [
      '$ zivodoc fix --auto-pr',
      '',
      'Generating fixes...',
      '  PR #142: Fix 12 broken import statements in /guides/',
      '  PR #143: Update API response schemas to match OpenAPI spec',
      '  PR #144: Fix dead links in /api/ (7 links)',
      '  PR #145: Update SDK version references v2 → v4.2.1',
      '',
      'Opened 4 PRs. Review in your dashboard.',
    ],
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  const [activeTab, setActiveTab] = useState<TabKey>('scan');
  const preview = tabPreviews[activeTab];

  return (
    <section className="bg-surface relative overflow-hidden">
      {/* Atmospheric glow — single soft radial, no color */}
      <div
        aria-hidden
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,255,255,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-14 pt-24 sm:pt-32 lg:pt-40 pb-0">
        <div className="flex flex-col items-center text-center">
          {/* Small pill badge */}
          <motion.div
            className="mb-8"
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
          >
            <span className="inline-flex items-center gap-2 border border-line-hover px-4 py-2">
              <span className="size-1.5 rounded-full bg-green" />
              <span className="font-label text-[11px] tracking-[-0.02em] text-ink-secondary">
                Now in early access
              </span>
            </span>
          </motion.div>

          {/* Headline — large, bold, gradient secondary line */}
          <motion.h1
            className="text-[48px] sm:text-[72px] lg:text-[88px] font-semibold leading-[0.95] tracking-[-0.04em] max-w-[900px]"
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
          >
            Your docs are broken.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(to right, #888 0%, #444 100%)',
              }}
            >
              We fix them.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="mt-8 text-[17px] sm:text-[19px] leading-[1.6] text-ink-secondary max-w-[520px]"
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
          >
            zivodoc scans your docs for broken code examples, stale API references, and dead links —
            then opens PRs to fix them. Automatically.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
          >
            <a
              href={`${APP_URL}/login`}
              className="font-label inline-flex items-center gap-2.5 h-[48px] px-6 bg-surface-button text-surface text-[13px] tracking-[-0.02em] hover:bg-white transition-colors"
            >
              Get early access
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a
              href="#features"
              className="font-label inline-flex items-center h-[48px] px-6 border border-line-hover text-ink-secondary text-[13px] tracking-[-0.02em] hover:border-ink-muted hover:text-ink transition-colors"
            >
              See how it works
            </a>
          </motion.div>
        </div>
      </div>

      {/* Terminal preview — the visual anchor */}
      <motion.div
        className="relative mt-20 sm:mt-28 max-w-[1000px] mx-auto px-8 lg:px-0 pb-24 sm:pb-32"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow behind terminal */}
        <div
          aria-hidden
          className="absolute inset-0 -top-8 -bottom-8 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)',
          }}
        />

        <div className="relative bg-surface-card border border-line overflow-hidden shadow-2xl shadow-black/40">
          {/* Tab bar — clean, monochrome, no colored dots */}
          <div className="flex items-center border-b border-line">
            <div className="flex items-center gap-1.5 px-5 py-4">
              <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
              <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
              <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
            </div>
            <div className="flex items-center gap-0 overflow-x-auto ml-2">
              {tabs.map((tab) => {
                const isActive = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex-shrink-0 px-5 py-4 font-label text-[11px] uppercase tracking-[0.02em] transition-colors ${
                      isActive ? 'text-ink' : 'text-ink-muted hover:text-ink-secondary'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-[1px] bg-ink"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code output */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="p-6 sm:p-8 overflow-x-auto"
          >
            <pre className="font-mono text-[12px] sm:text-[13px] leading-[1.9] text-ink-secondary whitespace-pre">
              {preview.code.map((line, i) => (
                <div key={i} className="flex gap-5">
                  <span className="select-none text-ink-dim w-5 shrink-0 text-right">{i + 1}</span>
                  <span className={line.startsWith('$') ? 'text-ink' : ''}>{line}</span>
                </div>
              ))}
            </pre>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
