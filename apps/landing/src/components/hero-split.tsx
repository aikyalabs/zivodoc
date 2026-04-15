import { useState } from 'react';
import { motion } from 'framer-motion';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

type TabKey = 'scan' | 'validate' | 'detect' | 'fix';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'scan', label: 'Scan' },
  { key: 'validate', label: 'Validate' },
  { key: 'detect', label: 'Detect' },
  { key: 'fix', label: 'Fix' },
];

const tabPreviews: Record<TabKey, string[]> = {
  scan: [
    '$ zivodoc scan --repo your-org/docs',
    '',
    'Connecting to repository...',
    'Crawling docs site... found 1,847 pages',
    '',
    'Extracting checkable items...',
    '    Code blocks... 423 examples',
    '    API refs... 189 endpoints',
    '    Links... 2,341 total',
    '',
    'Detected stack:',
    '    Languages:  JavaScript, Python, cURL',
    '    Spec:       openapi.yaml (OpenAPI 3.1)',
    '    Framework:  Docusaurus v3.2',
    '',
    '✓ 4,800 items across 1,847 pages. Ready to validate.',
  ],
  validate: [
    '$ zivodoc validate --all',
    '',
    'Running code examples in sandboxes...',
    '  [Node.js 20]  247/267 passed',
    '  [Python 3.12] 88/102 passed',
    '  [cURL]        36/54 passed',
    '',
    'Comparing API refs against OpenAPI spec...',
    '  ✗ 14 parameter mismatches',
    '  ✗ 8 outdated response schemas',
    '',
    'Checking 2,341 links...',
    '  ✗ 23 dead links found',
    '',
    '76 issues across 1,847 pages.',
  ],
  detect: [
    '$ zivodoc detect --ai',
    '',
    'Analyzing content with AI...',
    '',
    '  ! /guides/auth.md says "tokens expire in 1h"',
    '    /api/tokens.md says "tokens expire in 24h"',
    '  ! /guides/quickstart.md references SDK v2',
    '    Latest released version is v4.2.1',
    '  ! /api/errors.md shows 3 conflicting formats',
    '  ! /guides/rate-limits.md contradicts /api/limits.md',
    '',
    '7 contradictions, 4 stale refs, 2 confusing sections.',
  ],
  fix: [
    '$ zivodoc fix --auto-pr',
    '',
    'Generating fixes...',
    '  PR #142: Fix 12 broken import statements',
    '  PR #143: Update 8 API response schemas',
    '  PR #144: Fix 23 dead links across /api/',
    '  PR #145: Update SDK version refs v2 → v4.2.1',
    '  PR #146: Resolve 7 content contradictions',
    '',
    '5 PRs opened with 64 file changes.',
    'Review at your-org/docs/pulls',
    '',
    '✓ All fixes ready for review.',
  ],
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function HeroSplit() {
  const [activeTab, setActiveTab] = useState<TabKey>('scan');

  return (
    <section className="bg-surface relative overflow-hidden">
      {/* Atmospheric glow */}
      <div
        aria-hidden
        className="absolute top-[-100px] right-[10%] w-[800px] h-[600px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.025) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 pt-16 sm:pt-24 lg:pt-32 pb-20 sm:pb-32 lg:pb-40">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-center">
          {/* ── Left column — text ── */}
          <div>
            {/* Badge */}
            <motion.div
              className="mb-6"
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
            >
              <span className="inline-flex items-center gap-2 border border-line-hover px-3 py-1.5">
                <span className="size-1.5 rounded-full bg-green" />
                <span className="font-label text-[10px] tracking-[-0.02em] text-ink-secondary">
                  Now in early access
                </span>
              </span>
            </motion.div>

            {/* Headline — tighter line breaks */}
            <motion.h1
              className="text-[36px] sm:text-[56px] lg:text-[64px] font-semibold leading-[0.96] tracking-[-0.04em]"
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
            >
              Your docs are
              <br />
              broken.{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #999 0%, #444 100%)' }}
              >
                We fix
                <br />
                them.
              </span>
            </motion.h1>

            {/* Description — tighter to headline */}
            <motion.p
              className="mt-6 text-[16px] leading-[1.65] text-ink-secondary max-w-[380px]"
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
            >
              Scans your docs for broken code examples, stale API references, and dead links — then
              opens PRs to fix them.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="mt-8 flex flex-wrap items-center gap-3"
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
            >
              <a
                href={`${APP_URL}/login`}
                className="font-label inline-flex items-center gap-2.5 h-[46px] px-5 bg-surface-button text-surface text-[13px] tracking-[-0.02em] hover:bg-white transition-colors"
              >
                Get early access
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
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
                className="font-label inline-flex items-center h-[46px] px-5 border border-line-hover text-ink-secondary text-[13px] tracking-[-0.02em] hover:border-ink-muted hover:text-ink transition-colors"
              >
                How it works
              </a>
            </motion.div>
          </div>

          {/* ── Right column — terminal + stats ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3"
          >
            {/* Terminal */}
            <div className="bg-surface-card border border-line overflow-hidden shadow-2xl shadow-black/50">
              {/* Tab bar */}
              <div className="flex items-center border-b border-line">
                <div className="flex items-center gap-1.5 pl-5 pr-3 py-3.5">
                  <span className="size-[9px] rounded-full bg-[#1E1E1F]" />
                  <span className="size-[9px] rounded-full bg-[#1E1E1F]" />
                  <span className="size-[9px] rounded-full bg-[#1E1E1F]" />
                </div>
                <div className="flex items-center">
                  {tabs.map((tab) => {
                    const isActive = tab.key === activeTab;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`relative flex-shrink-0 px-4 py-3.5 font-label text-[10px] uppercase tracking-[0.04em] transition-colors ${
                          isActive ? 'text-ink' : 'text-ink-muted hover:text-ink-secondary'
                        }`}
                      >
                        {tab.label}
                        {isActive && (
                          <motion.div
                            layoutId="splitTab"
                            className="absolute bottom-0 left-2 right-2 h-[1px] bg-ink"
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
                transition={{ duration: 0.25 }}
                className="px-4 py-4 sm:px-7 sm:py-6 overflow-x-auto"
              >
                <pre className="font-mono text-[11px] sm:text-[13.5px] leading-[1.85] text-ink-secondary whitespace-pre">
                  {tabPreviews[activeTab].map((line, i) => (
                    <div key={i}>
                      <span
                        className={
                          line.startsWith('$')
                            ? 'text-ink'
                            : line.startsWith('✗')
                              ? 'text-red'
                              : line.startsWith('✓')
                                ? 'text-green'
                                : line.startsWith('!')
                                  ? 'text-yellow'
                                  : ''
                        }
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </pre>
              </motion.div>
            </div>

            {/* Stat cards — same gap as terminal border creates visual unity */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '32', label: 'Broken examples' },
                { value: '14', label: 'API mismatches' },
                { value: '5', label: 'PRs opened' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-card border border-line px-4 py-3.5">
                  <p className="text-[20px] font-semibold tracking-[-0.02em] text-ink leading-none">
                    {stat.value}
                  </p>
                  <p className="font-label text-[9px] text-ink-muted mt-2 uppercase tracking-[0.03em]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
