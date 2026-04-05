import Link from 'next/link';
import { FadeIn } from '@src/components/fade-in';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';

export function CTA() {
  return (
    <section className="bg-surface-alt border-t border-line">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <FadeIn>
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px w-16 bg-accent" />
            <span className="font-label text-[11px] uppercase tracking-[0.08em] text-ink-muted">
              Ready to Build
            </span>
          </div>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold leading-[1.04] tracking-[-0.04em] max-w-[700px]">
            Teams running on this template ship{' '}
            <span className="text-ink-muted">faster, with fewer bugs.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="mt-8 text-[17px] text-ink-secondary max-w-[480px] leading-[1.6]">
            Clone the repo, run the seed, ship your product. All the infrastructure is done.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={`${APP_URL}/login`}
              className="font-label inline-flex items-center gap-2.5 h-[52px] px-6 bg-surface-button text-white text-[14px] border border-[#262626] hover:bg-[#333] transition-colors"
            >
              GET STARTED
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-label inline-flex items-center h-[52px] px-6 bg-line text-ink text-[14px] hover:bg-[#ddd] transition-colors"
            >
              VIEW ON GITHUB
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
