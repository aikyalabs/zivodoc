import { useState } from 'react';
import { motion } from 'framer-motion';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

type TabKey = 'auth' | 'rbac' | 'tenancy' | 'types' | 'audit';

const tabs: { key: TabKey; label: string; color: string }[] = [
  { key: 'auth', label: 'Auth', color: '#10b981' },
  { key: 'rbac', label: 'RBAC', color: '#3b82f6' },
  { key: 'tenancy', label: 'Multi-Tenancy', color: '#8b5cf6' },
  { key: 'types', label: 'Type Safety', color: '#f59e0b' },
  { key: 'audit', label: 'Audit Logs', color: '#ef4444' },
];

const tabPreviews: Record<TabKey, { title: string; code: string[] }> = {
  auth: {
    title: 'auth.service.ts',
    code: [
      'async login(email: string, password: string) {',
      '  const user = await this.userRepo.findByEmail(email);',
      '  if (!user || user.isDisabled) throw new UnauthorizedException();',
      '  const valid = await bcrypt.compare(password, user.password);',
      '  if (!valid) throw new UnauthorizedException();',
      '  return this.createSession(user.id);',
      '}',
    ],
  },
  rbac: {
    title: 'users.controller.ts',
    code: [
      "@Controller('users')",
      'export class UsersController {',
      '  @Get()',
      "  @Roles('admin', 'owner')",
      "  @RequirePermissions({ resource: 'users', action: 'read' })",
      '  async list(@RequestUser() user: AuthUser) {',
      '    return this.usersService.list(user, pagination);',
      '  }',
      '}',
    ],
  },
  tenancy: {
    title: 'users.service.ts',
    code: [
      'async list(caller: Caller, options?: Pagination) {',
      '  const where = isAdmin(caller)',
      '    ? {}',
      '    : { organizationId: caller.organizationId! };',
      '  const [items, total] = await this.repo.findAndCount({',
      '    where, ...clampPagination(options),',
      '  });',
      '  return apiPaginatedResponse(items, total);',
      '}',
    ],
  },
  types: {
    title: 'packages/shared/user.schema.ts',
    code: [
      'export const createUserSchema = z.strictObject({',
      '  firstName: nonemptystring,',
      '  lastName: nonemptystring,',
      '  email: z.string().email(),',
      '  password: passwordSchema,',
      "  role: z.enum(UserRole).default('member'),",
      '});',
      'export type CreateUser = z.infer<typeof createUserSchema>;',
    ],
  },
  audit: {
    title: 'audit.interceptor.ts',
    code: [
      '@Injectable()',
      'export class AuditInterceptor implements NestInterceptor {',
      '  intercept(ctx: ExecutionContext, next: CallHandler) {',
      '    // Logs every POST/PATCH/DELETE automatically.',
      '    // Captures actor, IP, duration, sanitized metadata.',
      '    return next.handle().pipe(tap(() => this.log(ctx)));',
      '  }',
      '}',
    ],
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  const [activeTab, setActiveTab] = useState<TabKey>('auth');
  const preview = tabPreviews[activeTab];

  return (
    <section className="bg-surface-alt relative overflow-hidden">
      {/* Subtle dotted background pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.25] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #272727 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 30%, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black 30%, transparent)',
        }}
      />

      <div className="relative max-w-[1440px] mx-auto px-8 lg:px-14 pt-20 sm:pt-24 lg:pt-28 pb-0">
        <div className="flex flex-col items-center text-center">
          {/* Label badges */}
          <motion.div
            className="flex items-center gap-3 mb-10"
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
          >
            <span className="inline-flex items-center gap-2 bg-accent px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-ink" />
              <span className="font-label text-[11px] uppercase tracking-[-0.02em] text-ink">
                OPEN SOURCE
              </span>
            </span>
            <span className="font-label text-[11px] uppercase tracking-[-0.02em] text-ink-muted">
              MIT LICENSED · V1.0
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-[44px] sm:text-[64px] lg:text-[76px] font-semibold leading-[1.0] tracking-[-0.035em] max-w-[900px]"
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
          >
            Production SaaS Foundation
            <br />
            <span className="text-ink-muted">for Serious Engineers</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="mt-7 text-[16px] sm:text-[18px] leading-[1.6] text-ink-secondary max-w-[560px]"
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
          >
            Auth, RBAC, multi-tenancy, and full-stack type safety — wired up, tested, and ready to
            ship. <span className="text-ink">Stop rebuilding the same foundation.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            initial="hidden"
            animate="visible"
            custom={3}
            variants={fadeUp}
          >
            <a
              href={`${APP_URL}/login`}
              className="font-label inline-flex items-center gap-2.5 h-[52px] px-6 bg-surface-button text-white text-[14px] tracking-[-0.02em] hover:bg-[#333] transition-colors"
            >
              GET STARTED
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
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-label inline-flex items-center h-[52px] px-6 bg-line text-ink text-[14px] tracking-[-0.02em] hover:bg-[#ddd] transition-colors"
            >
              WHY THIS TEMPLATE?
            </a>
          </motion.div>

          {/* Social proof */}
          <motion.p
            className="mt-10 text-[13px] text-ink-muted max-w-[440px]"
            initial="hidden"
            animate="visible"
            custom={4}
            variants={fadeUp}
          >
            Trusted by engineering teams shipping production SaaS at startups and enterprises alike.
          </motion.p>
        </div>
      </div>

      {/* Tabs with colored indicators */}
      <motion.div
        className="relative mt-16 sm:mt-20 border-t border-line bg-surface"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
          <div className="flex items-center gap-0 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2.5 flex-shrink-0 px-6 py-5 font-label text-[12px] uppercase tracking-[-0.02em] border-b-2 transition-all ${
                    isActive
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink-secondary'
                  }`}
                >
                  <span
                    className="inline-block size-[8px] rounded-sm"
                    style={{ backgroundColor: tab.color }}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Code preview panel */}
      <div className="relative bg-surface pb-20 sm:pb-28">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-surface-dark border border-line-dark"
          >
            {/* Title bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-line-dark">
              <div className="flex items-center gap-1.5">
                <span className="size-[10px] rounded-full bg-[#3a3a3a]" />
                <span className="size-[10px] rounded-full bg-[#3a3a3a]" />
                <span className="size-[10px] rounded-full bg-[#3a3a3a]" />
              </div>
              <span className="font-label text-[11px] text-ink-light-muted/70 tracking-[-0.02em] ml-2">
                {preview.title}
              </span>
            </div>

            {/* Code */}
            <div className="p-6 sm:p-8 overflow-x-auto">
              <pre className="font-mono text-[12px] sm:text-[13px] leading-[1.85] text-ink-light-muted whitespace-pre">
                {preview.code.map((line, i) => (
                  <div key={i} className="flex gap-5">
                    <span className="select-none text-ink-light-muted/40 w-5 shrink-0 text-right">
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
