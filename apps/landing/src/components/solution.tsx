import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

export function Solution() {
  const steps = [
    {
      num: '01',
      title: 'Connect',
      description:
        'Point zivodoc at your repo and docs site. Works with any static site generator, docs framework, or custom setup. One-line CI integration to run on every push.',
      highlight: true,
    },
    {
      num: '02',
      title: 'Scan & Validate',
      description:
        'zivodoc crawls every page, extracts code blocks, API references, and links. Code examples are executed in isolated sandboxes. API endpoints are validated against your OpenAPI spec.',
      highlight: false,
    },
    {
      num: '03',
      title: 'Detect & Fix',
      description:
        'AI analyzes content for contradictions, outdated references, and confusing explanations. Then zivodoc opens PRs with the fixes — ready for your team to review and merge.',
      highlight: false,
    },
  ];

  return (
    <section id="solution" className="bg-surface-alt">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <FadeIn>
          <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-8">
            How It Works
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] max-w-[780px] mb-20 sm:mb-24">
            From broken docs to passing CI —{' '}
            <span className="text-ink-secondary">fully automated</span>
          </h2>
        </FadeIn>

        <FadeInStagger className="grid sm:grid-cols-3 gap-5">
          {steps.map((step) => (
            <FadeInStaggerItem
              key={step.num}
              className={`p-10 lg:p-12 border ${step.highlight ? 'bg-surface-elevated border-line-hover' : 'bg-surface-card border-line'}`}
            >
              <div
                className={`w-full h-[2px] mb-10 ${step.highlight ? 'bg-ink' : 'bg-line-hover'}`}
              />
              <span className="font-label text-[12px] font-bold text-ink-muted block mb-5">
                {step.num}
              </span>
              <h3 className="text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] mb-4 text-ink">
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.75] text-ink-secondary">{step.description}</p>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
