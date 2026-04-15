import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

const testimonials = [
  {
    quote:
      'We had no idea 30% of our code examples were broken until zivodoc scanned us. Fixed everything in a week with the auto-generated PRs.',
    name: 'Sarah Chen',
    title: 'Head of DevRel, API Platform',
    initials: 'SC',
  },
  {
    quote:
      'Our support tickets about docs dropped 40% in the first month. zivodoc catches things we never would have found manually.',
    name: 'Marcus Rivera',
    title: 'Lead Engineer, Developer Tools',
    initials: 'MR',
  },
  {
    quote:
      'The OpenAPI validation alone was worth it. Found 14 mismatches between our spec and our docs that had been there for months.',
    name: 'Emily Park',
    title: 'Founder, API Startup',
    initials: 'EP',
  },
  {
    quote:
      "We run zivodoc in CI on every push. Broken docs never make it to production anymore. It's like having a dedicated docs QA engineer.",
    name: 'James Okonkwo',
    title: 'Eng Lead, Infrastructure Co',
    initials: 'JO',
  },
  {
    quote:
      'The AI contradiction detection is genuinely impressive. It found places where our quickstart guide contradicted our API reference.',
    name: 'Priya Sharma',
    title: 'Senior Dev, Cloud Platform',
    initials: 'PS',
  },
  {
    quote:
      "Set it up in 5 minutes, caught 40+ issues on the first scan. Now our whole company is on the paid plan. Best docs tooling investment we've made.",
    name: 'Daniel Kim',
    title: 'VP Engineering, DevTool Co',
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
      className={`${wide ? 'sm:col-span-3' : 'sm:col-span-2'} ${featured ? 'bg-surface-elevated border border-line-hover' : 'bg-surface-card border border-line'}`}
    >
      <div className="p-10">
        <p
          className={`text-[15px] leading-[1.7] mb-8 ${featured ? 'text-ink' : 'text-ink-secondary'}`}
        >
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3">
          <div
            className={`size-[42px] rounded-full text-[12px] font-bold flex items-center justify-center shrink-0 ${featured ? 'bg-ink text-surface' : 'bg-surface-elevated text-ink-secondary'}`}
          >
            {t.initials}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-ink">{t.name}</p>
            <p className="text-[12px] text-ink-muted">{t.title}</p>
          </div>
        </div>
      </div>
    </FadeInStaggerItem>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-surface-alt">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <FadeIn className="text-center mb-20 sm:mb-24">
          <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em]">
            Trusted by developer tool teams
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
