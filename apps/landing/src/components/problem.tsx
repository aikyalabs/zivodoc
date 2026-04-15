import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

export function Problem() {
  return (
    <section id="problem" className="bg-surface">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14">
        {/* Narrative heading */}
        <div className="pt-16 sm:pt-36 lg:pt-44 pb-12 sm:pb-24">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-8">
              The Problem
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink max-w-[820px]">
              Docs rot silently after every code change.{' '}
              <span className="text-ink-secondary">
                Nobody catches it until users complain and churn.
              </span>
            </h2>
          </FadeIn>
        </div>

        {/* Divider columns */}
        <FadeInStagger className="grid sm:grid-cols-3 border-t border-line">
          {[
            {
              title: 'Broken code examples',
              description:
                '80% of docs sites have code examples that no longer work. Imports change, APIs deprecate, output formats shift. Your getting-started guide silently becomes a getting-stuck guide.',
            },
            {
              title: 'Stale API references',
              description:
                "Your OpenAPI spec says one thing, your docs say another. Required params marked optional, missing fields, wrong response schemas. Users hit errors your docs promised wouldn't happen.",
            },
            {
              title: 'Dead links everywhere',
              description:
                'Pages get renamed, sections get moved, external resources disappear. Every dead link is a user who clicked, got a 404, and lost trust in your product.',
            },
          ].map((item, i) => (
            <FadeInStaggerItem
              key={i}
              className={`py-14 sm:py-16 sm:pr-10 sm:border-r sm:last:border-r-0 border-line ${i > 0 ? 'sm:pl-10' : ''}`}
            >
              <h3 className="text-[17px] font-semibold leading-[1.35] text-ink mb-4">
                {item.title}
              </h3>
              <p className="text-[14px] leading-[1.75] text-ink-secondary">{item.description}</p>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
