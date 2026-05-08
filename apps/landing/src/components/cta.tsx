import { FadeIn } from './fade-in';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

export function CTA() {
  return (
    <section className="bg-surface border-t border-line">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-16 sm:py-36 lg:py-44">
        <FadeIn>
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px w-16 bg-ink-muted" />
            <span className="font-label text-[11px] uppercase tracking-[0.08em] text-ink-muted">
              Stop Losing Users
            </span>
          </div>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold leading-[1.04] tracking-[-0.04em] max-w-[700px]">
            Your docs are your product's first impression.{' '}
            <span className="text-ink-secondary">Make sure they work.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mt-8 text-[17px] text-ink-secondary max-w-[480px] leading-[1.6]">
            Connect your repo, run the first scan in under 5 minutes. Free tier — no credit card
            required.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href={`${APP_URL}/login`}
              className="font-label inline-flex items-center gap-2.5 h-[52px] px-6 bg-surface-button text-surface text-[14px] hover:bg-white transition-colors"
            >
              GET STARTED FREE
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
            <a
              href="/features"
              className="font-label inline-flex items-center h-[52px] px-6 border border-line text-ink-secondary text-[14px] hover:border-line-hover hover:text-ink transition-colors"
            >
              SEE ALL FEATURES
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
