import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const APP_URL = import.meta.env.PUBLIC_APP_URL ?? 'http://localhost:5173';

const navLinks = [
  { href: '/features', label: 'FEATURES' },
  { href: '/pricing', label: 'PRICING' },
  { href: '/about', label: 'ABOUT' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-line">
      {/* Full-width nav — no max-width, BOOK A DEMO flush to right edge */}
      <nav className="h-[54px] w-full flex items-center">
        {/* Logo — flush left with padding */}
        <div className="pl-8 lg:pl-14 pr-10 shrink-0">
          <a
            href="/"
            className="text-[16px] font-bold tracking-[-0.03em] hover:text-ink-secondary transition-colors"
          >
            SaaS Template
          </a>
        </div>

        {/* Nav links — grouped after logo */}
        <div className="hidden md:flex items-center gap-0">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-label h-[38px] flex items-center px-[13px] text-[12px] tracking-[-0.04em] text-ink bg-white hover:bg-surface-alt transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Spacer — pushes right content to the edge */}
        <div className="flex-1" />

        {/* Right side — login + CTA, flush to right edge */}
        <div className="hidden md:flex items-center h-full shrink-0">
          <a
            href={`${APP_URL}/login`}
            className="font-label flex items-center h-full px-6 text-[14px] tracking-[-0.04em] text-ink hover:text-ink-secondary transition-colors"
          >
            LOG IN
          </a>
          <a
            href={`${APP_URL}/login`}
            className="font-label flex items-center h-full px-6 min-w-[132px] justify-center gap-2.5 bg-surface-button text-white text-[14px] tracking-[-0.04em] hover:bg-[#333] transition-colors"
          >
            BOOK A DEMO
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden ml-auto mr-6 p-2"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-line bg-white px-8 py-8 flex flex-col gap-5">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="font-label text-[12px] tracking-[-0.04em] text-ink"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-5 border-t border-line">
            <a href={`${APP_URL}/login`} className="font-label text-[14px] text-ink">
              LOG IN
            </a>
            <a
              href={`${APP_URL}/login`}
              className="font-label flex items-center justify-center h-[54px] bg-surface-button text-white text-[14px]"
            >
              BOOK A DEMO
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
