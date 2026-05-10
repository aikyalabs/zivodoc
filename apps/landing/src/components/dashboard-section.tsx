import { useState } from 'react';
import { FadeIn } from './fade-in';

const issues = [
  { file: '/guides/quickstart.md', type: 'Broken code', severity: 'critical', line: 42 },
  { file: '/api/authentication.md', type: 'Stale API ref', severity: 'critical', line: 18 },
  { file: '/guides/webhooks.md', type: 'Dead link', severity: 'warning', line: 67 },
  { file: '/api/errors.md', type: 'Heading skip', severity: 'warning', line: 23 },
  { file: '/guides/pagination.md', type: 'Broken code', severity: 'critical', line: 91 },
  { file: '/api/tokens.md', type: 'Stale API ref', severity: 'info', line: 55 },
];

export function DashboardSection() {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <section className="bg-surface-alt border-t border-line">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-20 sm:py-36 lg:py-44">
        <div className="flex items-end justify-between mb-10 sm:mb-16 lg:mb-20">
          <div>
            <FadeIn>
              <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-5">
                02 / Live Dashboard
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink max-w-[620px]">
                See everything that's broken —{' '}
                <span className="text-ink-secondary">in one place</span>
              </h2>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="hidden md:block">
            <p className="font-label text-[11px] text-ink-muted max-w-[240px] text-right leading-[1.6]">
              Every issue tracked. Filter, resolve, re-scan.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <div className="bg-surface-card border border-line overflow-hidden shadow-2xl shadow-black/50">
            {/* Dashboard header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-line">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
                  <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
                  <span className="size-[10px] rounded-full bg-[#1E1E1F]" />
                </div>
                <span className="font-label text-[10px] sm:text-[11px] text-ink-muted tracking-[-0.02em]">
                  zivodoc — stripe/stripe-docs
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="font-label text-[9px] sm:text-[10px] text-ink-muted uppercase tracking-[0.05em] hidden sm:inline">
                  Last scan: 2m ago
                </span>
                <span className="size-1.5 rounded-full bg-green" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-line">
              {[
                { label: 'Pages scanned', value: '1,847', status: '' },
                { label: 'Code examples', value: '391/423', status: 'text-green' },
                { label: 'API endpoints', value: '175/189', status: 'text-yellow' },
                { label: 'Links checked', value: '2,318/2,341', status: 'text-yellow' },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`px-4 sm:px-6 py-4 sm:py-5 border-r border-line last:border-r-0 ${i % 2 === 1 ? 'border-r-0 sm:border-r' : ''} ${i >= 2 ? 'border-t sm:border-t-0 border-line' : ''}`}
                >
                  <p className="font-label text-[9px] sm:text-[10px] text-ink-muted uppercase tracking-[0.05em] mb-1 sm:mb-2">
                    {stat.label}
                  </p>
                  <p
                    className={`text-[16px] sm:text-[20px] font-semibold tracking-[-0.02em] ${stat.status || 'text-ink'}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Severity summary */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-line flex items-center gap-4 sm:gap-6 flex-wrap">
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

            {/* Issues table — horizontal scroll on mobile */}
            <div className="overflow-x-auto">
              <div className="min-w-[600px] divide-y divide-line">
                <div className="grid grid-cols-12 gap-4 px-4 sm:px-6 py-3 bg-surface-elevated">
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
                {issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-12 gap-4 px-4 sm:px-6 py-3.5 transition-colors ${hoveredRow === i ? 'bg-surface-elevated' : ''}`}
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
                      <span className="font-label text-[11px] text-ink-muted">
                        {issue.severity}
                      </span>
                    </span>
                    <span className="col-span-2 font-mono text-[12px] text-ink-muted text-right">
                      :{issue.line}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="px-4 sm:px-6 py-3 border-t border-line bg-surface-elevated flex items-center justify-between">
              <span className="font-label text-[10px] text-ink-muted">23 findings · 1m 42s</span>
              <span className="font-label text-[10px] text-ink-secondary px-3 py-1 bg-surface-button text-surface cursor-pointer hover:bg-white transition-colors">
                Open in dashboard →
              </span>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
