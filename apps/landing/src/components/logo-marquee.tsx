const logos = [
  'Stripe',
  'Twilio',
  'Vercel',
  'Supabase',
  'Cloudflare',
  'Datadog',
  'PlanetScale',
  'Linear',
  'Resend',
  'Clerk',
  'Neon',
  'Turso',
];

export function LogoMarquee() {
  return (
    <section
      className="py-12 overflow-hidden bg-surface border-y border-line"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div className="flex items-center gap-16 animate-[marquee_35s_linear_infinite] w-max">
        {[...logos, ...logos].map((name, i) => (
          <span
            key={i}
            className="text-[14px] font-medium text-ink-muted whitespace-nowrap select-none"
          >
            {name}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
