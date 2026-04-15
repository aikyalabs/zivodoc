import { Shield, Building2, Code2, Database, ScrollText, Zap } from 'lucide-react';
import { FadeIn } from './fade-in';
import { CTA } from './cta';

const features = [
  {
    icon: Shield,
    label: '01 / Authentication',
    title: 'Auth & RBAC, done right',
    description:
      'Session-based authentication with bcrypt password hashing and secure token generation. Three-tier role model — platform admins, organization owners, and members — with granular permissions stored as JSONB for flexibility without schema changes.',
    bullets: [
      'Bcrypt with 12 rounds by default',
      'Crypto-secure 48-byte session tokens',
      'Configurable expiry and refresh',
      'Platform admin bypass for support',
      'Granular resource/action permissions per role',
      'Caller pattern for clean service-layer authorization',
    ],
    code: `@Controller('users')
export class UsersController {
  @Get()
  @Roles('admin', 'owner')
  async list(@RequestUser() user: AuthUser) {
    return this.usersService.list(user, pagination);
  }
}`,
  },
  {
    icon: Building2,
    label: '02 / Multi-Tenancy',
    title: 'Org-scoped from day one',
    description:
      'Every tenant-scoped entity automatically filtered by organizationId. Admins see across all orgs, owners and members only see their own. The caller pattern handles all authorization in the service layer — controllers stay thin.',
    bullets: [
      'Automatic tenant isolation in queries',
      'Admin bypass for cross-org operations',
      'Cascade deletes and foreign keys',
      'ULID prefixes for entity identification',
      'Soft deletes with DeleteDateColumn',
      'Indexed organizationId on every tenant entity',
    ],
    code: `async list(caller: Caller, options?) {
  const where = isAdmin(caller)
    ? {}
    : { organizationId: caller.organizationId! };
  return this.repo.find({ where });
}`,
  },
  {
    icon: Code2,
    label: '03 / Type Safety',
    title: 'Schemas once, types everywhere',
    description:
      'Zod schemas defined once in the shared package are used for API validation (via createZodDto) and frontend form validation. Response schemas use strictObject so extra fields fail fast. Types are inferred end-to-end with zero drift.',
    bullets: [
      'Single source of truth in packages/shared',
      'createZodDto for NestJS integration',
      'strictObject for response contracts',
      'Shared enum types with type guards',
      'Request and response schemas co-located',
      'Dual ESM + CJS build via tsup',
    ],
    code: `export const createUserSchema = z.strictObject({
  email: z.string().email(),
  password: passwordSchema,
  role: z.enum(UserRole).default('member'),
});
export type CreateUser = z.infer<typeof createUserSchema>;`,
  },
  {
    icon: Database,
    label: '04 / Database',
    title: 'Production-ready PostgreSQL',
    description:
      'PostgreSQL 17 with TypeORM 0.3. Includes migration system, seed data, soft deletes, ULID primary keys with entity prefixes, connection pooling, and a @Global() DatabaseModule so repositories are injectable without imports.',
    bullets: [
      'TypeORM with data mapper pattern',
      'Migration generate / run / revert',
      'Seed script with idempotent checks',
      'ULID IDs via @BeforeInsert hooks',
      'Connection pooling (20 max, 5 min)',
      'Repository pattern with custom queries',
    ],
    code: `@Entity('users')
export class UserEntity extends BaseEntity {
  @BeforeInsert()
  generateId() {
    this.id = BaseEntity.generateId('user');
  }
}`,
  },
  {
    icon: ScrollText,
    label: '05 / Audit Logging',
    title: 'Every mutation, logged',
    description:
      "Global audit interceptor logs every POST, PATCH, and DELETE automatically. Captures actor ID, organization ID, IP address, user agent, request metadata, status code, and duration. Sensitive fields are redacted. Non-blocking — errors logged but don't fail the request.",
    bullets: [
      'Automatic capture on all mutations',
      'Actor, IP, user agent tracking',
      'Sanitized metadata (redacts secrets)',
      'Duration and status code tracking',
      'Per-organization audit trails',
      'SOC 2 compliance ready',
    ],
    code: `@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Logs every mutation automatically
  }
}`,
  },
  {
    icon: Zap,
    label: '06 / Modern Stack',
    title: 'Latest versions, zero legacy',
    description:
      'NestJS 11, React 19, TanStack Router 1, TanStack Query 5, Tailwind CSS 4, Turborepo v2. pnpm workspaces, Docker Compose for local dev, Jest 30 for API, Vitest 4 for frontend. Everything production-tested and current.',
    bullets: [
      'NestJS 11 with SWC fast builds',
      'React 19 with TanStack Router',
      'Tailwind CSS 4 + OKLCH colors',
      'Turborepo with smart caching',
      'pnpm 10 workspaces',
      'Jest 30 (API) + Vitest 4 (web)',
    ],
    code: `// turbo.json — smart build orchestration
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] }
  }
}`,
  },
];

export default function FeaturesContent() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-surface-alt">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-14 pt-32 sm:pt-40 lg:pt-48 pb-20 sm:pb-28">
          <FadeIn>
            <p className="font-label text-[12px] font-bold uppercase tracking-[0.08em] text-ink-muted mb-6">
              Features
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-[44px] sm:text-[60px] lg:text-[76px] font-semibold leading-[1.02] tracking-[-0.04em] max-w-[900px]">
              Every moving part you need.{' '}
              <span className="text-ink-muted">Nothing you don&apos;t.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-8 text-[17px] sm:text-[19px] leading-[1.55] text-ink-secondary max-w-[560px]">
              Six core building blocks, all wired up and battle-tested. Auth, tenancy, types,
              database, audit, and a modern stack.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Feature sections — alternating layouts */}
      {features.map((feature, i) => {
        const Icon = feature.icon;
        const isDark = i % 2 === 1;
        const isReverse = i % 2 === 1;
        return (
          <section
            key={feature.title}
            className={`${isDark ? 'bg-surface-dark' : 'bg-surface'} border-t ${isDark ? 'border-line-dark' : 'border-line'}`}
          >
            <div className="max-w-[1440px] mx-auto px-8 lg:px-14 py-24 sm:py-32">
              <div
                className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start ${isReverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                {/* Left — text */}
                <div>
                  <FadeIn>
                    <div
                      className={`flex size-12 items-center justify-center mb-8 ${isDark ? 'bg-[#252525]' : 'bg-surface-alt'}`}
                    >
                      <Icon
                        className={`size-5 ${isDark ? 'text-ink-light-muted' : 'text-ink-secondary'}`}
                        strokeWidth={1.5}
                      />
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.05}>
                    <p
                      className={`font-label text-[11px] font-bold uppercase tracking-[0.1em] mb-5 ${isDark ? 'text-ink-light-muted' : 'text-ink-muted'}`}
                    >
                      {feature.label}
                    </p>
                  </FadeIn>
                  <FadeIn delay={0.1}>
                    <h2
                      className={`text-[32px] sm:text-[44px] font-semibold leading-[1.08] tracking-[-0.03em] mb-6 ${isDark ? 'text-ink-light' : 'text-ink'}`}
                    >
                      {feature.title}
                    </h2>
                  </FadeIn>
                  <FadeIn delay={0.15}>
                    <p
                      className={`text-[15px] leading-[1.7] mb-8 max-w-[500px] ${isDark ? 'text-ink-light-muted' : 'text-ink-secondary'}`}
                    >
                      {feature.description}
                    </p>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <ul className="flex flex-col gap-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <span
                            className={`mt-2 size-1 rounded-full shrink-0 ${isDark ? 'bg-ink-light-muted' : 'bg-ink-muted'}`}
                          />
                          <span
                            className={`text-[14px] ${isDark ? 'text-ink-light-muted' : 'text-ink-secondary'}`}
                          >
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </FadeIn>
                </div>

                {/* Right — code snippet */}
                <FadeIn delay={0.2}>
                  <div
                    className={`p-8 lg:p-10 font-mono text-[12px] leading-[1.7] border ${isDark ? 'bg-[#161616] border-line-dark text-ink-light-muted' : 'bg-surface-alt border-line text-ink-secondary'}`}
                  >
                    <pre className="whitespace-pre-wrap break-words">
                      <code>{feature.code}</code>
                    </pre>
                  </div>
                </FadeIn>
              </div>
            </div>
          </section>
        );
      })}

      <CTA />
    </main>
  );
}
