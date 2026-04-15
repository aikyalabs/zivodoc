import { FadeIn } from './fade-in';

const row1 = [
  'NestJS',
  'React 19',
  'TanStack Router',
  'TanStack Query',
  'PostgreSQL',
  'TypeORM',
  'Redis',
  'MinIO',
  'Docker',
  'Turborepo',
];

const row2 = [
  'Zod',
  'bcrypt',
  'Session Auth',
  'ULID',
  'JSONB Permissions',
  'Audit Logs',
  'Rate Limiting',
  'TypeScript',
  'Tailwind CSS 4',
  'pnpm Workspaces',
];

function MarqueeRow({
  items,
  direction = 'left',
  duration = 40,
}: {
  items: string[];
  direction?: 'left' | 'right';
  duration?: number;
}) {
  const animationName = direction === 'left' ? 'marquee-left' : 'marquee-right';

  return (
    <div
      className="relative overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div
        className="flex items-center gap-12 w-max"
        style={{
          animation: `${animationName} ${duration}s linear infinite`,
        }}
      >
        {[...items, ...items, ...items].map((item, i) => (
          <div key={i} className="flex items-center gap-12 flex-shrink-0">
            <span className="text-[32px] sm:text-[44px] font-bold tracking-[-0.03em] text-ink whitespace-nowrap select-none hover:text-pop transition-colors cursor-default">
              {item}
            </span>
            <span className="size-2 rounded-full bg-ink-muted/40 flex-shrink-0" />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-33.333%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function TechMarquee() {
  return (
    <section className="bg-surface-alt border-y border-line overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 pt-20 sm:pt-24 pb-8">
        <FadeIn>
          <p className="font-label text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted mb-4">
            Technical Stack
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] max-w-[640px] mb-12 sm:mb-16">
            The modern toolkit, assembled and wired up for you.
          </h2>
        </FadeIn>
      </div>

      <div className="py-10 sm:py-14 flex flex-col gap-8 sm:gap-10">
        <MarqueeRow items={row1} direction="left" duration={50} />
        <MarqueeRow items={row2} direction="right" duration={50} />
      </div>

      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 pb-20 sm:pb-24" />
    </section>
  );
}
