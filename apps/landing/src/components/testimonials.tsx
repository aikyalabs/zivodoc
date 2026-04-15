import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

const testimonials = [
  {
    quote:
      'This template saved us months. Auth, RBAC, and multi-tenancy worked out of the box. We shipped our MVP in 10 days.',
    name: 'Sarah Chen',
    title: 'CTO, Flowbase',
    initials: 'SC',
  },
  {
    quote:
      'Type safety across the entire stack. Not a single runtime type error since we switched to this.',
    name: 'Marcus Rivera',
    title: 'Lead Engineer, Stackwise',
    initials: 'MR',
  },
  {
    quote: 'Best DX in a SaaS starter. Monorepo with Turborepo is buttery smooth.',
    name: 'Emily Park',
    title: 'Founder, Devcraft',
    initials: 'EP',
  },
  {
    quote:
      'Idea to production in two weeks. Migration system and seed data made onboarding painless for the whole team.',
    name: 'James Okonkwo',
    title: 'Eng Lead, Layerform',
    initials: 'JO',
  },
  {
    quote:
      'Finally treats RBAC as first-class. The caller pattern is elegant and scales beautifully.',
    name: 'Priya Sharma',
    title: 'Senior Dev, Nimbus',
    initials: 'PS',
  },
  {
    quote: 'Audit logging alone was worth it. Passed SOC 2 with minimal extra work.',
    name: 'Daniel Kim',
    title: 'Head of Eng, Comply.io',
    initials: 'DK',
  },
];

// Asymmetric rows: wide+narrow, narrow+wide, wide+narrow
const rows = [
  { items: [testimonials[0], testimonials[1]], wideIndex: 0 },
  { items: [testimonials[2], testimonials[3]], wideIndex: 1 },
  { items: [testimonials[4], testimonials[5]], wideIndex: 0 },
];

function TestimonialCard({
  t,
  wide,
  featured = false,
}: {
  t: (typeof testimonials)[number];
  wide: boolean;
  featured?: boolean;
}) {
  return (
    <FadeInStaggerItem
      className={`${wide ? 'sm:col-span-3' : 'sm:col-span-2'} ${featured ? 'bg-accent' : 'bg-surface-card'}`}
    >
      <div className="p-10">
        <p
          className={`text-[15px] leading-[1.7] mb-8 ${featured ? 'text-ink' : 'text-ink-secondary'}`}
        >
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div
            className={`size-[42px] rounded-full text-[12px] font-bold flex items-center justify-center shrink-0 ${featured ? 'bg-ink text-white' : 'bg-surface-button text-white'}`}
          >
            {t.initials}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">{t.name}</p>
            <p className={`text-[12px] ${featured ? 'text-ink/60' : 'text-ink-muted'}`}>
              {t.title}
            </p>
          </div>
        </div>
      </div>
    </FadeInStaggerItem>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-surface">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <FadeIn className="text-center mb-20 sm:mb-24">
          <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em]">
            Loved by top engineers
          </h2>
        </FadeIn>

        <div className="flex flex-col gap-5">
          {rows.map((row, ri) => (
            <FadeInStagger key={ri} className="grid sm:grid-cols-5 gap-5">
              {row.items.map((t, ci) => (
                <TestimonialCard
                  key={t.name}
                  t={t}
                  wide={ci === row.wideIndex}
                  featured={ri === 0 && ci === row.wideIndex}
                />
              ))}
            </FadeInStagger>
          ))}
        </div>
      </div>
    </section>
  );
}
