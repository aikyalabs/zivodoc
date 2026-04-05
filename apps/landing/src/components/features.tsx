import { Shield, Building2, Code2, Database, ScrollText, Zap } from 'lucide-react';
import { FadeIn, FadeInStagger, FadeInStaggerItem } from '@src/components/fade-in';

const features = [
  {
    icon: Shield,
    title: 'Auth & RBAC',
    medium: 'Security',
    description:
      'Session-based auth with bcrypt hashing. Three-tier role model with admins, org owners, and members. Granular JSONB permissions per role for fine-grained access control.',
    span: 'md:col-span-2 md:row-span-2',
    size: 'large',
  },
  {
    icon: Building2,
    title: 'Multi-Tenancy',
    medium: 'Architecture',
    description:
      'Org-scoped data isolation out of the box. Every query filtered by tenant automatically.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    icon: Code2,
    title: 'Full-Stack Type Safety',
    medium: 'Developer Experience',
    description:
      'Zod schemas defined once. Validated on the API, inferred on the frontend. Zero drift.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    icon: Database,
    title: 'Production Database',
    medium: 'Infrastructure',
    description:
      'PostgreSQL 17 + TypeORM with migrations, seed data, soft deletes, ULID primary keys, connection pooling.',
    span: 'md:col-span-2 md:row-span-1',
    size: 'medium',
  },
  {
    icon: ScrollText,
    title: 'Audit Logging',
    medium: 'Compliance',
    description:
      'Every mutation logged automatically. Actor tracking, IPs, durations, sanitized metadata. SOC 2 ready.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
  {
    icon: Zap,
    title: 'Modern Stack',
    medium: 'Tech',
    description: 'NestJS 11, React 19, TanStack Router & Query, Tailwind CSS 4, Turborepo.',
    span: 'md:col-span-1 md:row-span-1',
    size: 'small',
  },
];

export function Features() {
  return (
    <section id="features" className="bg-surface-dark">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-28 sm:py-36 lg:py-44">
        <div className="flex items-end justify-between mb-16 lg:mb-20">
          <div>
            <FadeIn>
              <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-light-muted mb-5">
                01 / Capabilities
              </p>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h2 className="text-[36px] sm:text-[48px] lg:text-[58px] font-semibold leading-[1.04] tracking-[-0.04em] text-ink-light max-w-[620px]">
                Built for production from day one
              </h2>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="hidden md:block">
            <p className="font-label text-[11px] text-ink-light-muted max-w-[240px] text-right leading-[1.6]">
              Everything you need to ship a real SaaS — nothing you don&apos;t.
            </p>
          </FadeIn>
        </div>

        {/* Asymmetric bento grid */}
        <FadeInStagger className="grid grid-cols-1 md:grid-cols-4 auto-rows-[240px] md:auto-rows-[220px] gap-4 lg:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <FadeInStaggerItem
                key={feature.title}
                className={`group relative bg-surface-dark-card border border-line-dark p-8 lg:p-10 overflow-hidden transition-colors duration-500 hover:border-[#444] ${feature.span}`}
              >
                {/* Index marker */}
                <span className="absolute top-5 right-5 font-label text-[10px] text-ink-light-muted/40 tracking-wider">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Icon */}
                <div className="flex size-10 items-center justify-center bg-[#252525] mb-6">
                  <Icon className="size-[18px] text-ink-light-muted" strokeWidth={1.5} />
                </div>

                {/* Medium label */}
                <p className="font-label text-[10px] uppercase tracking-[0.1em] text-ink-light-muted/60 mb-2">
                  {feature.medium}
                </p>

                {/* Title */}
                <h3
                  className={`font-semibold leading-[1.15] tracking-[-0.02em] text-ink-light mb-4 ${feature.size === 'large' ? 'text-[28px]' : 'text-[18px]'}`}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p
                  className={`text-[14px] leading-[1.65] text-ink-light-muted ${feature.size === 'large' ? 'max-w-[380px]' : ''}`}
                >
                  {feature.description}
                </p>

                {/* Corner accent line — shows on hover */}
                <div className="absolute top-0 right-0 size-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-0 right-0 w-full h-[1px] bg-ink-light-muted/30" />
                  <div className="absolute top-0 right-0 w-[1px] h-full bg-ink-light-muted/30" />
                </div>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
