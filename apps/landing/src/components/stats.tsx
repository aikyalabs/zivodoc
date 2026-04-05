import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@src/components/fade-in';

const stats = [
  { value: '6 weeks', label: 'of boilerplate eliminated' },
  { value: '100%', label: 'end-to-end type safety' },
  { value: '3-role', label: 'RBAC model built in' },
  { value: 'Zero', label: 'runtime type drift' },
];

export function Stats() {
  return (
    <section className="bg-accent relative overflow-hidden border-y border-line">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-24 sm:py-32">
        <div className="mb-16 sm:mb-20 max-w-[640px]">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink mb-6">
              By the Numbers
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
              The foundation, quantified.
            </h2>
          </FadeIn>
        </div>

        <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4 gap-y-12">
          {stats.map((stat, i) => (
            <FadeInStaggerItem
              key={i}
              className="lg:px-10 lg:first:pl-0 lg:last:pr-0 lg:border-l lg:first:border-l-0 border-ink/10 flex flex-col gap-3"
            >
              <span className="font-pixel text-[48px] sm:text-[64px] lg:text-[72px] font-bold tracking-[-0.04em] leading-[0.9] text-ink">
                {stat.value}
              </span>
              <span className="text-[13px] text-ink/70 leading-relaxed">{stat.label}</span>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
