const logos = [
  'Acme Corp',
  'Globex',
  'Initech',
  'Hooli',
  'Pied Piper',
  'Massive Dynamic',
  'Stark Industries',
  'Wayne Enterprises',
  'Umbrella Corp',
  'Cyberdyne',
  'Soylent',
  'Wonka Industries',
];

export function LogoMarquee() {
  return (
    <section
      className="py-12 overflow-hidden bg-surface"
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
            className="text-[14px] font-medium text-ink-muted/50 whitespace-nowrap select-none"
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
