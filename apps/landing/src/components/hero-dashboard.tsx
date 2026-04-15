import { useState } from 'react';
import { motion } from 'framer-motion';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const issues = [
  { file: '/guides/quickstart.md', type: 'Broken code', severity: 'critical', line: 42 },
  { file: '/api/authentication.md', type: 'Stale API ref', severity: 'critical', line: 18 },
  { file: '/guides/webhooks.md', type: 'Dead link', severity: 'warning', line: 67 },
  { file: '/api/errors.md', type: 'Contradiction', severity: 'warning', line: 23 },
  { file: '/guides/pagination.md', type: 'Broken code', severity: 'critical', line: 91 },
  { file: '/api/tokens.md', type: 'Stale API ref', severity: 'info', line: 55 },
];

export function HeroDashboard() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <section className="bg-surface relative overflow-hidden">
      {/* Atmospheric glow */}
      <div
        aria-hidden
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,255,255,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-14 pt-24 sm:pt-32 lg:pt-40 pb-0">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
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

          {/* Headline */}
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
              style={{ backgroundImage: 'linear-gradient(to right, #888 0%, #444 100%)' }}
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
            then opens PRs to fix them.
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

      {/* Dashboard mockup — the visual anchor */}
      <motion.div
        className="relative mt-20 sm:mt-28 max-w-[1100px] mx-auto px-8 lg:px-0 pb-24 sm:pb-32"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow behind dashboard */}
        <div
          aria-hidden
          className="absolute -inset-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,255,255,0.015) 0%, transparent 70%)',
          }}
        />

        <div className="relative bg-surface-card border border-line overflow-hidden shadow-2xl shadow-black/50">
          {/* Dashboard header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
                <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
                <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
              </div>
              <span className="font-label text-[11px] text-ink-muted tracking-[-0.02em]">
                zivodoc — stripe/stripe-docs
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-label text-[10px] text-ink-muted uppercase tracking-[0.05em]">
                Last scan: 2m ago
              </span>
              <span className="size-1.5 rounded-full bg-green" />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 border-b border-line">
            {[
              { label: 'Pages scanned', value: '1,847', status: '' },
              { label: 'Code examples', value: '391/423', status: 'text-green' },
              { label: 'API endpoints', value: '175/189', status: 'text-yellow' },
              { label: 'Links checked', value: '2,318/2,341', status: 'text-yellow' },
            ].map((stat) => (
              <div key={stat.label} className="px-6 py-5 border-r border-line last:border-r-0">
                <p className="font-label text-[10px] text-ink-muted uppercase tracking-[0.05em] mb-2">
                  {stat.label}
                </p>
                <p
                  className={`text-[20px] font-semibold tracking-[-0.02em] ${stat.status || 'text-ink'}`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Issue severity bars */}
          <div className="px-6 py-4 border-b border-line flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="size-2 bg-red" />
              <span className="font-label text-[10px] text-ink-secondary">12 Critical</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 bg-yellow" />
              <span className="font-label text-[10px] text-ink-secondary">8 Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 bg-ink-muted" />
              <span className="font-label text-[10px] text-ink-secondary">3 Info</span>
            </div>
            <div className="flex-1" />
            <span className="font-label text-[10px] text-ink-muted">23 issues found</span>
          </div>

          {/* Issues table */}
          <div className="divide-y divide-line">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-elevated">
              <span className="col-span-5 font-label text-[10px] text-ink-muted uppercase tracking-[0.05em]">
                File
              </span>
              <span className="col-span-3 font-label text-[10px] text-ink-muted uppercase tracking-[0.05em]">
                Issue type
              </span>
              <span className="col-span-2 font-label text-[10px] text-ink-muted uppercase tracking-[0.05em]">
                Severity
              </span>
              <span className="col-span-2 font-label text-[10px] text-ink-muted uppercase tracking-[0.05em] text-right">
                Line
              </span>
            </div>
            {/* Rows */}
            {issues.map((issue, i) => (
              <div
                key={i}
                className={`grid grid-cols-12 gap-4 px-6 py-3.5 transition-colors ${hoveredRow === i ? 'bg-surface-elevated' : ''}`}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                <span className="col-span-5 font-mono text-[12px] text-ink-secondary truncate">
                  {issue.file}
                </span>
                <span className="col-span-3 font-label text-[11px] text-ink-secondary">
                  {issue.type}
                </span>
                <span className="col-span-2 flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${issue.severity === 'critical' ? 'bg-red' : issue.severity === 'warning' ? 'bg-yellow' : 'bg-ink-muted'}`}
                  />
                  <span className="font-label text-[11px] text-ink-muted">{issue.severity}</span>
                </span>
                <span className="col-span-2 font-mono text-[12px] text-ink-muted text-right">
                  :{issue.line}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="px-6 py-3 border-t border-line bg-surface-elevated flex items-center justify-between">
            <span className="font-label text-[10px] text-ink-muted">4 PRs ready to open</span>
            <span className="font-label text-[10px] text-ink-secondary px-3 py-1 bg-surface-button text-surface">
              Auto-fix all →
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
