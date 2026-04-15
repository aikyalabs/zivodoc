const columns = [
  {
    title: 'Products',
    links: [
      { label: 'Auth & Sessions', href: '/features' },
      { label: 'RBAC Engine', href: '/features' },
      { label: 'Multi-Tenancy', href: '/features' },
      { label: 'Audit Logging', href: '/features' },
      { label: 'API Framework', href: '/features' },
    ],
  },
  {
    title: 'Learn More',
    links: [
      { label: 'Pricing', href: '/pricing' },
      { label: 'About Us', href: '/about' },
      { label: 'Features', href: '/features' },
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
      { label: 'Cookies Policy', href: '/cookies' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-accent overflow-hidden" style={{ paddingTop: '50px' }}>
      <div className="max-w-[1440px] mx-auto px-8 lg:px-14">
        {/* Main grid: left description, right 4 columns */}
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Left side — logo + description */}
          <div className="lg:w-[45%] shrink-0">
            <h2 className="text-[16px] font-bold tracking-[-0.03em] text-ink">SaaS Template</h2>
            <div className="mt-6 space-y-6 max-w-[310px]">
              <p className="text-[15px] leading-[1.3] text-ink">
                A production-ready SaaS monorepo with auth, RBAC, multi-tenancy, and full-stack type
                safety.
              </p>
              <p className="text-[15px] leading-[1.3] text-ink">
                We built the foundation so engineering teams can skip the boilerplate and ship
                features from day one. No more wiring together tools and writing rules.
              </p>
              <p className="text-[15px] leading-[1.3] text-ink">
                Clone the repo, run the seed, and start building what matters.
              </p>
            </div>
          </div>

          {/* Right side — 4 columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-10 gap-y-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3
                  className="font-label uppercase text-ink"
                  style={{
                    fontSize: '12.6px',
                    letterSpacing: '-0.01em',
                    fontWeight: 700,
                    lineHeight: '15px',
                  }}
                >
                  {col.title}
                </h3>
                <ul className="mt-5 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[14px] leading-[14px] text-[#1A1A1A] hover:text-ink-secondary transition-colors"
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
          <p className="text-[14px] text-ink-secondary">
            SaaS Template &copy; {new Date().getFullYear()} | All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Large watermark — responsive vw-based, edge-to-edge, partially clipped at bottom */}
      <div className="mt-20 w-full overflow-hidden">
        <span
          className="block font-bold tracking-[-0.05em] select-none whitespace-nowrap text-center"
          style={{
            fontSize: '15vw',
            lineHeight: 0.85,
            color: 'rgba(0,0,0,0.05)',
            transform: 'translateY(20%)',
          }}
        >
          SaaSTemplate
        </span>
      </div>
    </footer>
  );
}
