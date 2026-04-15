import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

export function Problem() {
  return (
    <section id="problem" className="bg-surface-dark">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        {/* Narrative heading */}
        <div className="pt-28 sm:pt-36 lg:pt-44 pb-20 sm:pb-24">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-light-muted mb-8">
              The Problem
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink-light max-w-[820px]">
              You&apos;ve built auth, roles, and tenancy before.{' '}
              <span className="text-ink-light-muted">Then everything broke in production.</span>
            </h2>
          </FadeIn>
        </div>

        {/* Divider columns */}
        <FadeInStagger className="grid sm:grid-cols-3 border-t border-line-dark">
          {[
            {
              title: 'Weeks lost to boilerplate',
              description:
                'Session management, password hashing, RBAC guards, token validation. Every project starts with 2–4 weeks of the same plumbing before you write a single feature.',
            },
            {
              title: 'Tenancy bolted on too late',
              description:
                "Adding org-scoped isolation after launch means rewriting queries, rethinking permissions, and praying you don't leak data between customers.",
            },
            {
              title: 'Types that lie to you',
              description:
                'API shapes defined twice — once in the backend, once in the frontend. When they drift, you get silent failures in production that no test catches.',
            },
          ].map((item, i) => (
            <FadeInStaggerItem
              key={i}
              className={`py-14 sm:py-16 sm:pr-10 sm:border-r sm:last:border-r-0 border-line-dark ${i > 0 ? 'sm:pl-10' : ''}`}
            >
              <h3 className="text-[17px] font-semibold leading-[1.35] text-ink-light mb-4">
                {item.title}
              </h3>
              <p className="text-[14px] leading-[1.75] text-ink-light-muted">{item.description}</p>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
