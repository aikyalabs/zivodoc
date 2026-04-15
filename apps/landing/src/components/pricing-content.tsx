import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';
import { CTA } from './cta';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

const faqs = [
  {
    q: 'Will there be a free tier?',
    a: "Yes — we're planning a generous free tier so you can try zivodoc on your docs before committing. Details coming soon.",
  },
  {
    q: 'How will pricing work?',
    a: 'Simple, transparent pricing with no per-seat fees. Pay based on the number of docs sites you monitor and the scan frequency you need.',
  },
  {
    q: 'Can I start using zivodoc now?',
    a: "Yes! Sign up for early access and you'll get free unlimited scanning while we're in beta. Early users will be grandfathered into the best pricing when we launch.",
  },
  {
    q: 'What happens after the beta?',
    a: "Early access users will be grandfathered into the best pricing when we launch. You'll always have time to evaluate before committing to a paid plan.",
  },
];

export default function PricingContent() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-surface">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              Pricing
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[76px] font-semibold leading-[1.02] tracking-[-0.04em] max-w-[820px]">
              Simple pricing. <span className="text-ink-secondary">Coming soon.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-8 text-[17px] sm:text-[19px] leading-[1.55] text-ink-secondary max-w-[520px]">
              We're finalizing our pricing plans. Sign up for early access now and get free
              unlimited scanning while we're in beta.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Coming soon card */}
      <section className="bg-surface-alt border-t border-line">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-20 sm:py-28">
          <FadeIn>
            <div className="max-w-[640px] mx-auto text-center">
              <div className="bg-surface-card border border-line p-12 lg:p-16">
                <div className="inline-flex items-center gap-2 bg-surface-elevated border border-line-hover px-3 py-1.5 mb-8">
                  <span className="size-1.5 bg-green" />
                  <span className="font-label text-[11px] uppercase tracking-[-0.02em] text-ink-secondary">
                    BETA
                  </span>
                </div>
                <h2 className="text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] mb-6">
                  Free during early access
                </h2>
                <p className="text-[15px] leading-[1.7] text-ink-secondary mb-10 max-w-[420px] mx-auto">
                  Get unlimited scans, full API validation, and AI-powered analysis while we're in
                  beta. Early users get the best pricing when we launch.
                </p>
                <a
                  href={`${APP_URL}/login`}
                  className="font-label inline-flex items-center gap-2.5 h-[52px] px-8 bg-surface-button text-surface text-[14px] tracking-[-0.02em] hover:bg-white transition-colors"
                >
                  GET EARLY ACCESS
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
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <p className="text-[32px] font-bold tracking-[-0.03em] mb-2">$0</p>
                  <p className="text-[13px] text-ink-secondary">Free tier, always</p>
                </div>
                <div>
                  <p className="text-[32px] font-bold tracking-[-0.03em] mb-2">$29</p>
                  <p className="text-[13px] text-ink-secondary">Pro, starting at</p>
                </div>
                <div>
                  <p className="text-[32px] font-bold tracking-[-0.03em] mb-2">$79</p>
                  <p className="text-[13px] text-ink-secondary">Team, starting at</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface border-t border-line">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-28 sm:py-36">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              Frequently Asked
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[36px] sm:text-[48px] font-semibold leading-[1.04] tracking-[-0.04em] max-w-[600px] mb-16">
              Questions, answered.
            </h2>
          </FadeIn>

          <FadeInStagger className="grid md:grid-cols-2 gap-10 lg:gap-14">
            {faqs.map((faq) => (
              <FadeInStaggerItem key={faq.q}>
                <h3 className="text-[18px] font-semibold tracking-[-0.015em] mb-3">{faq.q}</h3>
                <p className="text-[14px] leading-[1.7] text-ink-secondary">{faq.a}</p>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      <CTA />
    </main>
  );
}
