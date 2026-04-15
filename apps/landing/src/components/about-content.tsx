import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';
import { CTA } from './cta';

const principles = [
  {
    num: '01',
    title: 'Docs are product',
    description:
      "Developer documentation isn't a nice-to-have. It's the first thing your users interact with, the main driver of adoption, and the #1 reason developers choose one tool over another. Broken docs aren't a cosmetic issue — they're a product bug.",
  },
  {
    num: '02',
    title: 'Automate what humans forget',
    description:
      "Nobody manually checks every code example after every deploy. Nobody re-validates API docs against the spec on every release. These things need to happen automatically, continuously, and without human intervention. That's what CI is for.",
  },
  {
    num: '03',
    title: "Fix, don't just report",
    description:
      "Dashboards full of warnings don't get acted on. PRs do. zivodoc doesn't just tell you what's broken — it opens a PR with the fix. The goal is fewer broken docs, not more alerts.",
  },
  {
    num: '04',
    title: 'Built for developer tools',
    description:
      'Developer documentation is different. Code examples need to actually run. API references need to match the spec. Version numbers need to be current. We built zivodoc specifically for this — not generic content, but technical docs that need to be correct.',
  },
];

const stats = [
  { value: '80%', label: 'of docs sites have broken examples' },
  { value: '2025', label: 'founded' },
  { value: '6', label: 'layers of docs QA' },
  { value: '5 min', label: 'to first scan' },
];

export default function AboutContent() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-surface">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 pt-32 sm:pt-40 lg:pt-48 pb-24 sm:pb-32">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-8">
              About
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-[44px] sm:text-[64px] lg:text-[84px] font-semibold leading-[1.0] tracking-[-0.04em] max-w-[1100px]">
              We built this because{' '}
              <span className="text-ink-secondary">broken docs are a broken product.</span>
            </h1>
          </FadeIn>
        </div>
      </section>

      {/* Narrative section */}
      <section className="bg-surface-alt border-t border-line">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-24 sm:py-32">
          <div className="max-w-[720px]">
            <FadeIn>
              <p className="text-[22px] sm:text-[28px] leading-[1.4] tracking-[-0.015em] mb-10 text-ink">
                We kept hitting the same problem: you push a code change, and somewhere in your
                docs, a code example silently breaks. An API param gets renamed but the docs still
                show the old name. A link to a guide that got reorganized now 404s.
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="text-[16px] sm:text-[18px] leading-[1.7] text-ink-secondary mb-8">
                Nobody catches it until a user files a support ticket, writes a frustrated tweet, or
                quietly switches to a competitor. By then, the damage is done. We realized that docs
                quality is a testing problem — and testing problems are solved with automation, not
                more humans.
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="text-[16px] sm:text-[18px] leading-[1.7] text-ink-secondary">
                zivodoc is the tool we wished existed. Connect your repo and docs site, and it
                continuously scans for every kind of docs breakage — broken code examples, stale API
                references, dead links, contradictions, content drift. Then it opens PRs to fix what
                it finds. Think of it as Datadog for docs quality.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-surface-card border-y border-line">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-20 sm:py-24">
          <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <FadeInStaggerItem
                key={i}
                className="py-6 lg:py-2 lg:px-10 lg:first:pl-0 lg:last:pr-0 lg:border-l lg:first:border-l-0 border-line flex flex-col gap-3"
              >
                <span className="text-[44px] sm:text-[56px] font-bold tracking-[-0.04em] leading-[0.9] text-ink">
                  {stat.value}
                </span>
                <span className="text-[13px] text-ink-secondary">{stat.label}</span>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-surface">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-28 sm:py-36">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              Principles
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink max-w-[700px] mb-20">
              What we believe.
            </h2>
          </FadeIn>

          <FadeInStagger className="flex flex-col divide-y divide-line">
            {principles.map((p) => (
              <FadeInStaggerItem
                key={p.num}
                className="py-10 lg:py-14 grid lg:grid-cols-12 gap-6 lg:gap-10 items-start"
              >
                <div className="lg:col-span-2">
                  <span className="font-label text-[14px] text-ink-muted tracking-wide">
                    {p.num}
                  </span>
                </div>
                <div className="lg:col-span-5">
                  <h3 className="text-[24px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
                    {p.title}
                  </h3>
                </div>
                <div className="lg:col-span-5">
                  <p className="text-[15px] leading-[1.75] text-ink-secondary">{p.description}</p>
                </div>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      <CTA />
    </main>
  );
}
