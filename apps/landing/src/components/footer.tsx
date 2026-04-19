const isExternal = (href: string) => href.startsWith('http');

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Code Scanner', href: '/features' },
      { label: 'API Validator', href: '/features' },
      { label: 'Link Checker', href: '/features' },
      { label: 'AI Analysis', href: '/features' },
      { label: 'Auto-Fix PRs', href: '/features' },
    ],
  },
  {
    title: 'Learn More',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'About Us', href: '/about' },
      { label: 'Features', href: '/features' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Socials',
    links: [
      { label: 'Twitter', href: 'https://twitter.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
      { label: 'Discord', href: 'https://discord.com' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="bg-surface-card overflow-hidden border-t border-line"
      style={{ paddingTop: '50px' }}
    >
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left side */}
          <div className="lg:w-[45%] shrink-0">
            <p className="text-[16px] font-bold tracking-[-0.03em] text-ink">zivodoc</p>
            <div className="mt-6 space-y-6 max-w-[310px]">
              <p className="text-[15px] leading-[1.3] text-ink-secondary">
                Automated QA for developer documentation. Finds broken code examples, stale API
                references, and dead links — then opens PRs to fix them.
              </p>
              <p className="text-[15px] leading-[1.3] text-ink-secondary">
                Connect your repo and docs site. zivodoc continuously monitors for docs drift so
                your users never hit a broken example again.
              </p>
              <p className="text-[15px] leading-[1.3] text-ink-secondary">
                Built for every developer tool company in the world.
              </p>
            </div>
          </div>

          {/* Right side — columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-10 gap-y-8">
            {columns.map((col) => (
              <div key={col.title}>
                <p
                  className="font-label uppercase text-ink-secondary"
                  style={{
                    fontSize: '12.6px',
                    letterSpacing: '-0.01em',
                    fontWeight: 700,
                    lineHeight: '15px',
                  }}
                >
                  {col.title}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[14px] leading-[14px] text-ink-muted hover:text-ink-secondary transition-colors"
                        {...(isExternal(link.href)
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-24">
          <p className="text-[14px] text-ink-muted">
            zivodoc &copy; {new Date().getFullYear()} | All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Large watermark */}
      <div className="mt-20 w-full overflow-hidden">
        <span
          className="block font-bold tracking-[-0.05em] select-none whitespace-nowrap text-center"
          style={{
            fontSize: '15vw',
            lineHeight: 0.85,
            color: 'rgba(255,255,255,0.02)',
            transform: 'translateY(20%)',
          }}
        >
          zivodoc
        </span>
      </div>
    </footer>
  );
}
