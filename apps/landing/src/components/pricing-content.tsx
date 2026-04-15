import { Check } from 'lucide-react';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';
import { CTA } from './cta';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

const tiers = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Perfect for side projects, prototypes, and learning.',
    features: [
      'Up to 3 team members',
      '1 organization',
      'Community support',
      'Basic RBAC',
      'All core features',
      'Self-hosted',
    ],
    cta: 'GET STARTED',
    href: `${APP_URL}/login`,
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    description: 'For growing teams that need more power and support.',
    features: [
      'Up to 25 team members',
      '5 organizations',
      'Priority email support',
      'Advanced RBAC & permissions',
      'Full audit logging',
      'Custom roles',
      'API access',
      'SLA 99.9%',
    ],
    cta: 'START FREE TRIAL',
    href: `${APP_URL}/login`,
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For organizations that need full control and dedicated support.',
    features: [
      'Unlimited team members',
      'Unlimited organizations',
      'Dedicated support',
      'SSO & SAML',
      'Advanced audit trails',
      'Custom integrations',
      'SLA 99.99%',
      'On-premise option',
      'Compliance assistance',
    ],
    cta: 'CONTACT SALES',
    href: 'mailto:sales@example.com',
    highlighted: false,
  },
];

const faqs = [
  {
    q: 'Is this really open source?',
    a: 'Yes, MIT licensed. You can use it for any commercial or personal project. The Pro and Enterprise tiers are for hosted services and support on top of the template.',
  },
  {
    q: 'Can I self-host on the Pro plan?',
    a: 'Absolutely. You can self-host at any tier. The Pro and Enterprise plans give you managed hosting, support, and additional features — but everything remains available to self-host.',
  },
  {
    q: 'What counts as a team member?',
    a: "Any user account in your organization with access to the admin panel. Read-only public users don't count.",
  },
  {
    q: 'Do you offer discounts for startups?',
    a: 'Yes — 50% off Pro for the first year for YC companies, accelerator startups, and teams under 10 people. Contact us for details.',
  },
];

export default function PricingContent() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-surface-alt">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-14 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              Pricing
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[76px] font-semibold leading-[1.02] tracking-[-0.04em] max-w-[820px]">
              Simple pricing. <span className="text-ink-muted">No surprises.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-8 text-[17px] sm:text-[19px] leading-[1.55] text-ink-secondary max-w-[520px]">
              Start free and self-hosted. Upgrade when you need managed hosting, support, or
              enterprise features. Cancel anytime.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-surface border-t border-line">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-20 sm:py-28">
          <FadeInStagger className="grid md:grid-cols-3 gap-5">
            {tiers.map((tier) => (
              <FadeInStaggerItem
                key={tier.name}
                className={`flex flex-col p-10 lg:p-12 border transition-colors ${
                  tier.highlighted
                    ? 'bg-surface-dark border-surface-dark'
                    : 'bg-surface-alt border-line'
                }`}
              >
                <div className="mb-8">
                  <p
                    className={`font-label text-[11px] font-bold uppercase tracking-[0.1em] mb-3 ${tier.highlighted ? 'text-ink-light-muted' : 'text-ink-muted'}`}
                  >
                    {tier.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-[48px] font-semibold tracking-[-0.03em] leading-none ${tier.highlighted ? 'text-ink-light' : 'text-ink'}`}
                    >
                      {tier.price}
                    </span>
                    <span
                      className={`text-[13px] ${tier.highlighted ? 'text-ink-light-muted' : 'text-ink-muted'}`}
                    >
                      {tier.period}
                    </span>
                  </div>
                  <p
                    className={`mt-4 text-[14px] leading-[1.6] ${tier.highlighted ? 'text-ink-light-muted' : 'text-ink-secondary'}`}
                  >
                    {tier.description}
                  </p>
                </div>

                <ul className="flex-1 flex flex-col gap-3.5 mb-10">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check
                        className={`size-4 mt-0.5 shrink-0 ${tier.highlighted ? 'text-ink-light' : 'text-ink'}`}
                        strokeWidth={2.5}
                      />
                      <span
                        className={`text-[14px] ${tier.highlighted ? 'text-ink-light' : 'text-ink-secondary'}`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={tier.href}
                  className={`font-label inline-flex items-center justify-center gap-2.5 h-[52px] px-6 text-[14px] transition-colors ${
                    tier.highlighted
                      ? 'bg-white text-ink hover:bg-ink-light'
                      : 'bg-surface-button text-white hover:bg-[#333]'
                  }`}
                >
                  {tier.cta}
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
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-alt border-t border-line">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36">
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
