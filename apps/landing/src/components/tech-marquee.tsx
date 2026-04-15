import { FadeIn, FadeInStagger, FadeInStaggerItem } from './fade-in';

const categories = [
  {
    label: 'Docs Frameworks',
    items: [
      'Docusaurus',
      'GitBook',
      'Mintlify',
      'ReadMe',
      'Nextra',
      'Starlight',
      'VitePress',
      'Sphinx',
      'MkDocs',
    ],
  },
  {
    label: 'Languages',
    items: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Ruby', 'cURL', 'Java', 'PHP'],
  },
  {
    label: 'API Specs',
    items: ['OpenAPI 3.x', 'Swagger 2.0', 'GraphQL', 'REST', 'gRPC'],
  },
  {
    label: 'Content',
    items: ['Markdown', 'MDX', 'AsciiDoc', 'reStructuredText'],
  },
];

export function TechMarquee() {
  return (
    <section className="bg-surface-alt border-y border-line">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24">
          {/* Left — heading */}
          <div>
            <FadeIn>
              <p className="font-label text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted mb-5">
                Works With
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-[32px] sm:text-[40px] lg:text-[48px] font-semibold leading-[1.08] tracking-[-0.03em]">
                Every docs framework, every language, every spec.
              </h2>
            </FadeIn>
            <FadeIn delay={0.15}>
              <p className="mt-6 text-[15px] text-ink-secondary leading-[1.65] max-w-[360px]">
                zivodoc auto-detects your stack. No config needed — just point it at your repo.
              </p>
            </FadeIn>
          </div>

          {/* Right — categorized grid */}
          <div className="grid sm:grid-cols-2 gap-12">
            {categories.map((cat, ci) => (
              <FadeInStagger key={cat.label} className="flex flex-col">
                <FadeIn>
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted mb-4">
                    {cat.label}
                  </p>
                </FadeIn>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item, i) => (
                    <FadeInStaggerItem key={item}>
                      <span className="inline-flex items-center h-[32px] px-3 border border-line text-[12px] text-ink-secondary font-label tracking-[-0.01em] hover:border-line-hover hover:text-ink transition-colors cursor-default">
                        {item}
                      </span>
                    </FadeInStaggerItem>
                  ))}
                </div>
              </FadeInStagger>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
