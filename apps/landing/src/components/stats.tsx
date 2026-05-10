import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

const stats = [
  { value: '21', label: 'finding categories the scanner ships with' },
  { value: 'JS', label: 'examples executed in a WASM sandbox' },
  { value: 'CI', label: 'GitHub Action and CLI for any provider' },
  { value: '5 min', label: 'to run your first scan, free' },
];

export function Stats() {
  return (
    <section className="bg-surface-card relative overflow-hidden border-y border-line">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-24 sm:py-32">
        <div className="mb-16 sm:mb-20 max-w-[640px]">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              By the Numbers
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
              What the scanner actually does.
            </h2>
          </FadeIn>
        </div>

        <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4 gap-y-12">
          {stats.map((stat, i) => (
            <FadeInStaggerItem
              key={i}
              className="lg:px-10 lg:first:pl-0 lg:last:pr-0 lg:border-l lg:first:border-l-0 border-line flex flex-col gap-3"
            >
              <span className="text-[40px] sm:text-[52px] lg:text-[60px] font-bold tracking-[-0.04em] leading-[0.9] text-ink whitespace-nowrap">
                {stat.value}
              </span>
              <span className="text-[13px] text-ink-secondary leading-relaxed">{stat.label}</span>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
