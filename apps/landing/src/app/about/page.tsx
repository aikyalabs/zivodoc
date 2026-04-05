import type { Metadata } from 'next';
import { Header } from '@src/components/header';
import { Footer } from '@src/components/footer';
import { CTA } from '@src/components/cta';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@src/components/fade-in';

export const metadata: Metadata = {
  title: 'About — SaaS Template',
  description: 'Why we built this template and what we believe about SaaS engineering.',
};

const principles = [
  {
    num: '01',
    title: 'Skip the boring parts',
    description:
      "Auth, RBAC, multi-tenancy, audit logging — these aren't features your users care about. They're plumbing. Every SaaS needs them, and every engineer wastes weeks rebuilding them. We built this so you don't have to.",
  },
  {
    num: '02',
    title: 'Type safety or bust',
    description:
      'Runtime type errors are preventable. When your API and frontend share the same schemas and inferred types, entire classes of bugs disappear. This template takes type safety seriously from the database to the UI.',
  },
  {
    num: '03',
    title: 'Boring tech, current versions',
    description:
      'PostgreSQL, NestJS, React, TypeORM — nothing exotic. Just the best-in-class boring tools, all on their latest versions. No legacy dependencies, no clever hacks. Things that work.',
  },
  {
    num: '04',
    title: 'Production from day one',
    description:
      "Not a prototype. Not a tutorial. A real foundation you can ship to production on day one. Migration system, audit logging, rate limiting, Dockerfiles, healthchecks — it's all wired up.",
  },
  {
    num: '05',
    title: 'Open source, forever',
    description:
      'MIT licensed. Fork it, modify it, ship it commercially. We make money on managed hosting and support for teams that want it. The template itself is yours.',
  },
];

const stats = [
  { value: '10k+', label: 'developers using it' },
  { value: '2026', label: 'founded' },
  { value: '100%', label: 'open source' },
  { value: 'MIT', label: 'licensed' },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero — editorial large type */}
        <section className="bg-surface-alt">
          <div className="max-w-[1440px] mx-auto px-8 lg:px-14 pt-32 sm:pt-40 lg:pt-48 pb-24 sm:pb-32">
            <FadeIn>
              <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-8">
                About
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-[44px] sm:text-[64px] lg:text-[84px] font-semibold leading-[1.0] tracking-[-0.04em] max-w-[1100px]">
                We built this because{' '}
                <span className="text-ink-muted">we were tired of rebuilding it.</span>
              </h1>
            </FadeIn>
          </div>
        </section>

        {/* Narrative section — single column manifesto */}
        <section className="bg-surface border-t border-line">
          <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-24 sm:py-32">
            <div className="max-w-[720px]">
              <FadeIn>
                <p className="text-[22px] sm:text-[28px] leading-[1.4] tracking-[-0.015em] mb-10">
                  Every time we started a new SaaS project, the first month looked the same: wire up
                  auth, add role checks, scope data by organization, set up migrations, define
                  shared types, add audit logging. Same 6 weeks. Every. Single. Time.
                </p>
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="text-[16px] sm:text-[18px] leading-[1.7] text-ink-secondary mb-8">
                  At some point we started copy-pasting from previous projects. Then we extracted a
                  template. Then we rewrote the template three times as we learned what worked and
                  what didn&apos;t. This repository is that template, battle-tested across dozens of
                  real projects, refined until the boring parts actually disappear.
                </p>
              </FadeIn>
              <FadeIn delay={0.15}>
                <p className="text-[16px] sm:text-[18px] leading-[1.7] text-ink-secondary">
                  It&apos;s not a framework. It&apos;s not a no-code tool. It&apos;s a real codebase
                  — NestJS, React, PostgreSQL, TypeScript — that you clone, understand, own, and
                  ship. The boring parts come done. The interesting parts are up to you.
                </p>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-surface-card border-y border-line">
          <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-20 sm:py-24">
            <FadeInStagger className="grid grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, i) => (
                <FadeInStaggerItem
                  key={i}
                  className="py-6 lg:py-2 lg:px-10 lg:first:pl-0 lg:last:pr-0 lg:border-l lg:first:border-l-0 border-line flex flex-col gap-3"
                >
                  <span className="font-pixel text-[44px] sm:text-[56px] font-bold tracking-[-0.04em] leading-[0.9]">
                    {stat.value}
                  </span>
                  <span className="text-[13px] text-ink-secondary">{stat.label}</span>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* Principles — large list */}
        <section className="bg-surface-dark">
          <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36">
            <FadeIn>
              <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-light-muted mb-6">
                Principles
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink-light max-w-[700px] mb-20">
                What we believe.
              </h2>
            </FadeIn>

            <FadeInStagger className="flex flex-col divide-y divide-line-dark">
              {principles.map((p) => (
                <FadeInStaggerItem
                  key={p.num}
                  className="py-10 lg:py-14 grid lg:grid-cols-12 gap-6 lg:gap-10 items-start"
                >
                  <div className="lg:col-span-2">
                    <span className="font-label text-[14px] text-ink-light-muted tracking-wide">
                      {p.num}
                    </span>
                  </div>
                  <div className="lg:col-span-5">
                    <h3 className="text-[24px] sm:text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-light">
                      {p.title}
                    </h3>
                  </div>
                  <div className="lg:col-span-5">
                    <p className="text-[15px] leading-[1.75] text-ink-light-muted">
                      {p.description}
                    </p>
                  </div>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
