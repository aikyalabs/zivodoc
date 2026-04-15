import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

export function Solution() {
  const steps = [
    {
      num: '01',
      title: 'Clone & Run',
      description:
        'One command. Docker Compose brings up Postgres, Redis, MinIO. Seed the database — you have a working app with admin and org owner accounts.',
      highlight: true,
    },
    {
      num: '02',
      title: 'Build Features',
      description:
        'Auth, RBAC, multi-tenancy, audit logging — all wired up. Define Zod schemas once in the shared package. Validated on API, inferred on frontend.',
      highlight: false,
    },
    {
      num: '03',
      title: 'Ship It',
      description:
        'Production Dockerfiles included. Session auth with bcrypt, rate limiting, input validation. Deploy anywhere containers run.',
      highlight: false,
    },
  ];

  return (
    <section id="solution" className="bg-surface-alt">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <FadeIn>
          <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-8">
            How It Works
          </p>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] max-w-[780px] mb-20 sm:mb-24">
            3 steps to a shipping product —{' '}
            <span className="text-ink-muted">done in under a week</span>
          </h2>
        </FadeIn>

        <FadeInStagger className="grid sm:grid-cols-3 gap-5">
          {steps.map((step) => (
            <FadeInStaggerItem
              key={step.num}
              className={`p-10 lg:p-12 ${step.highlight ? 'bg-accent' : 'bg-surface-card'}`}
            >
              <div className={`w-full h-1 mb-10 ${step.highlight ? 'bg-ink' : 'bg-line'}`} />
              <span className="font-label text-[12px] font-bold text-ink-muted block mb-5">
                {step.num}
              </span>
              <h3 className="text-[20px] font-semibold leading-[1.25] tracking-[-0.02em] mb-4 text-ink">
                {step.title}
              </h3>
              <p
                className={`text-[14px] leading-[1.75] ${step.highlight ? 'text-ink/70' : 'text-ink-secondary'}`}
              >
                {step.description}
              </p>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
