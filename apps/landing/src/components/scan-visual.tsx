import { motion } from 'framer-motion';
import { FadeIn } from './fade-in';

const issueCards = [
  { label: '/guides/quickstart.md', type: 'Broken code', severity: 'critical' },
  { label: '/api/authentication.md', type: 'Stale API ref', severity: 'critical' },
  { label: '/api/errors.md', type: 'Contradiction', severity: 'warning' },
  { label: '/guides/webhooks.md', type: 'Dead link', severity: 'warning' },
  { label: '/api/tokens.md', type: 'Stale API ref', severity: 'info' },
  { label: '/guides/pagination.md', type: 'Broken code', severity: 'critical' },
];

const fixCards = [
  { title: 'PR #142', desc: 'Fix 12 broken imports' },
  { title: 'PR #143', desc: 'Update API schemas' },
  { title: 'PR #144', desc: 'Fix 7 dead links' },
];

function IssueCard({ card, index }: { card: (typeof issueCards)[number]; index: number }) {
  return (
    <motion.div
      className="bg-surface-card border border-line px-4 py-3 shadow-lg shadow-black/20"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`size-1.5 rounded-full ${card.severity === 'critical' ? 'bg-red' : card.severity === 'warning' ? 'bg-yellow' : 'bg-ink-muted'}`}
        />
        <span className="font-label text-[10px] text-ink-muted uppercase tracking-[0.03em]">
          {card.type}
        </span>
      </div>
      <p className="font-mono text-[11px] text-ink-secondary">{card.label}</p>
    </motion.div>
  );
}

function FixCard({ card, index }: { card: (typeof fixCards)[number]; index: number }) {
  return (
    <motion.div
      className="bg-surface-elevated border border-line-hover px-4 py-3 shadow-lg shadow-black/20"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="size-1.5 rounded-full bg-green" />
        <span className="font-label text-[10px] text-green uppercase tracking-[0.03em]">
          Fix ready
        </span>
      </div>
      <p className="text-[12px] font-semibold text-ink">{card.title}</p>
      <p className="font-label text-[10px] text-ink-muted mt-0.5">{card.desc}</p>
    </motion.div>
  );
}

export function ScanVisual() {
  return (
    <section className="bg-surface border-t border-line overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 pt-28 sm:pt-36 lg:pt-44">
        <div className="text-center mb-16 sm:mb-20">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-5">
              03 / Scan &amp; Fix
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink max-w-[700px] mx-auto">
              Issues found. <span className="text-ink-secondary">Fixes generated.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="mt-6 text-[17px] text-ink-secondary max-w-[480px] mx-auto leading-[1.6]">
              zivodoc maps every issue in your docs, then generates PRs to fix them — all in a
              single scan.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Full-width card layout using CSS grid */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 pb-28 sm:pb-36 lg:pb-44">
        {/* Grid background behind cards */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -inset-x-8 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
              backgroundSize: '64px 64px',
              maskImage: 'radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 70%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 70%)',
            }}
          />

          {/* Issue cards — top row, spread across full width */}
          <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {issueCards.map((card, i) => (
              <IssueCard key={i} card={card} index={i} />
            ))}
          </div>

          {/* Connecting line visual */}
          <div className="relative flex items-center justify-center py-8 sm:py-12">
            <motion.div
              className="w-full h-px bg-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            />
            <motion.div
              className="absolute bg-surface-elevated border border-line-hover px-5 py-2.5"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <span className="font-label text-[11px] text-ink-secondary tracking-[-0.02em]">
                zivodoc auto-fix →
              </span>
            </motion.div>
          </div>

          {/* Fix PR cards — bottom row, centered */}
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[900px] mx-auto">
            {fixCards.map((card, i) => (
              <FixCard key={i} card={card} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
