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

const floatCards = [
  {
    x: '8%',
    y: '18%',
    delay: 0.6,
    label: '/guides/quickstart.md',
    type: 'Broken code',
    severity: 'critical',
  },
  {
    x: '65%',
    y: '12%',
    delay: 0.8,
    label: '/api/authentication.md',
    type: 'Stale API ref',
    severity: 'critical',
  },
  {
    x: '75%',
    y: '55%',
    delay: 1.0,
    label: '/api/errors.md',
    type: 'Contradiction',
    severity: 'warning',
  },
  {
    x: '5%',
    y: '60%',
    delay: 1.2,
    label: '/guides/webhooks.md',
    type: 'Dead link',
    severity: 'warning',
  },
  {
    x: '40%',
    y: '70%',
    delay: 1.4,
    label: '/api/tokens.md',
    type: 'Stale API ref',
    severity: 'info',
  },
];

const fixCards = [
  { x: '18%', y: '42%', delay: 1.8, title: 'PR #142', desc: 'Fix 12 broken imports' },
  { x: '60%', y: '38%', delay: 2.0, title: 'PR #143', desc: 'Update API schemas' },
];

export function HeroVisual() {
  return (
    <section className="bg-surface relative overflow-hidden">
      {/* Grid pattern background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 60% at 50% 40%, black 20%, transparent 70%)',
        }}
      />

      {/* Central glow */}
      <div
        aria-hidden
        className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-14 pt-24 sm:pt-32 lg:pt-40">
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

      {/* Floating issue cards — visual "scan" happening */}
      <div className="relative max-w-[1200px] mx-auto h-[400px] sm:h-[500px] mt-8">
        {floatCards.map((card, i) => (
          <motion.div
            key={i}
            className="absolute bg-surface-card border border-line px-4 py-3 shadow-xl shadow-black/30 max-w-[280px]"
            style={{ left: card.x, top: card.y }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`size-1.5 rounded-full ${card.severity === 'critical' ? 'bg-red' : card.severity === 'warning' ? 'bg-yellow' : 'bg-ink-muted'}`}
              />
              <span className="font-label text-[10px] text-ink-muted uppercase tracking-[0.03em]">
                {card.type}
              </span>
            </div>
            <p className="font-mono text-[11px] text-ink-secondary truncate">{card.label}</p>
          </motion.div>
        ))}

        {/* Fix PR cards — appearing after issues */}
        {fixCards.map((card, i) => (
          <motion.div
            key={`fix-${i}`}
            className="absolute bg-surface-elevated border border-line-hover px-4 py-3 shadow-xl shadow-black/30"
            style={{ left: card.x, top: card.y }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: card.delay, ease: [0.22, 1, 0.36, 1] }}
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
        ))}

        {/* Connecting lines — subtle scan visualization */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          <motion.line
            x1="50%"
            y1="0"
            x2="15%"
            y2="25%"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
          <motion.line
            x1="50%"
            y1="0"
            x2="72%"
            y2="18%"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1.0 }}
          />
          <motion.line
            x1="50%"
            y1="0"
            x2="80%"
            y2="60%"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          />
        </svg>
      </div>
    </section>
  );
}
