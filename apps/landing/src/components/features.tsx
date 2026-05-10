import { Search, Terminal, GitPullRequest, Brain, Link2, Plug } from 'lucide-react';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

const features = [
  {
    icon: Terminal,
    title: 'Code Block Validation',
    medium: 'Execution',
    description:
      'Every JavaScript example in your docs runs in an isolated WASM sandbox to catch ReferenceError, TypeError, and runtime crashes. JS, TypeScript, JSON, and YAML blocks are also syntax-checked, so broken examples get flagged before they hit your users.',
    bullets: [
      'JavaScript runtime in WASM',
      'JS / TS syntax checking',
      'JSON / YAML validation',
      'Per-block error context',
    ],
    span: 'md:col-span-2 md:row-span-2',
    size: 'large' as const,
  },
  {
    icon: Search,
    title: 'API Validation',
    medium: 'Accuracy',
    description:
      'Compares every API reference in your docs against your OpenAPI spec. Catches wrong params, missing fields, and outdated schemas. Supports OpenAPI 3.0, 3.1, and Swagger 2.0.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small' as const,
  },
  {
    icon: Link2,
    title: 'Dead Link Detection',
    medium: 'Reliability',
    description:
      'Scans every internal and external link. Finds 404s, redirect chains, and anchors that no longer exist.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small' as const,
  },
  {
    icon: Brain,
    title: 'Secret & Quality Scan',
    medium: 'Hygiene',
    description:
      'Detects leaked API keys, internal-only URLs, missing alt text, broken images, heading skips, TODO markers, and placeholder text — the small stuff that erodes trust over time.',
    span: 'md:col-span-2 md:row-span-1',
    size: 'medium' as const,
  },
  {
    icon: GitPullRequest,
    title: 'PR Checks & Comments',
    medium: 'GitHub',
    description:
      'GitHub App posts a check status and a sticky PR comment listing every finding, so docs reviews happen in the same place as code reviews.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small' as const,
  },
  {
    icon: Plug,
    title: 'CI Integration',
    medium: 'Integration',
    description:
      'GitHub Action and CLI for any CI provider. One line to set up. Fails the build on error-severity findings.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small' as const,
  },
];

export function Features() {
  return (
    <section id="features" className="bg-surface">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-16 sm:py-36 lg:py-44">
        <div className="flex items-end justify-between mb-16 lg:mb-20">
          <div>
            <FadeIn>
              <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-5">
                01 / Capabilities
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink max-w-[620px]">
                Everything your docs need to stay accurate
              </h2>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="hidden md:block">
            <p className="font-label text-[11px] text-ink-muted max-w-[240px] text-right leading-[1.6]">
              Continuous monitoring. Automatic fixes. Zero manual effort.
            </p>
          </FadeIn>
        </div>

        {/* Asymmetric bento grid */}
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5 md:grid-rows-[minmax(260px,auto)_minmax(260px,auto)_minmax(260px,auto)]">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLarge = feature.size === 'large';
            return (
              <FadeInStaggerItem
                key={feature.title}
                className={`group relative bg-surface-card border border-line p-8 lg:p-10 transition-colors duration-500 hover:border-line-hover flex flex-col ${feature.span}`}
              >
                {/* Index marker */}
                <span className="absolute top-5 right-5 font-label text-[10px] text-ink-dim tracking-wider">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Icon */}
                <div className="flex size-10 items-center justify-center bg-surface-elevated mb-6 shrink-0">
                  <Icon className="size-[18px] text-ink-secondary" strokeWidth={1.5} />
                </div>

                {/* Medium label */}
                <p className="font-label text-[10px] uppercase tracking-[0.1em] text-ink-muted mb-2">
                  {feature.medium}
                </p>

                {/* Title */}
                <h3
                  className={`font-semibold leading-[1.15] tracking-[-0.02em] text-ink mb-4 ${
                    isLarge ? 'text-[28px] sm:text-[32px]' : 'text-[18px]'
                  }`}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-[14px] leading-[1.7] text-ink-secondary ${
                    isLarge ? 'max-w-[420px]' : ''
                  }`}
                >
                  {feature.description}
                </p>

                {/* Bullets — only for large featured card */}
                {isLarge && feature.bullets && (
                  <div className="mt-auto pt-8 flex flex-wrap gap-2">
                    {feature.bullets.map((bullet) => (
                      <span
                        key={bullet}
                        className="font-label text-[10px] uppercase tracking-[0.04em] text-ink-muted px-2.5 py-1 border border-line"
                      >
                        {bullet}
                      </span>
                    ))}
                  </div>
                )}

                {/* Corner line — shows on hover */}
                <div className="absolute top-0 right-0 size-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute top-0 right-0 w-full h-[1px] bg-ink-muted" />
                  <div className="absolute top-0 right-0 w-[1px] h-full bg-ink-muted" />
                </div>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
