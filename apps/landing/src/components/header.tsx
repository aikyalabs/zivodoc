'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173';

const navLinks = [
  { href: '/features', label: 'FEATURES' },
  { href: '/pricing', label: 'PRICING' },
  { href: '/about', label: 'ABOUT' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-line">
      <nav className="max-w-[1440px] mx-auto h-[54px] flex items-center">
        {/* Logo */}
        <div className="pl-8 lg:pl-14 pr-10">
          <Link href="/" className="text-[16px] font-bold tracking-[-0.03em]">
            SaaS Template
          </Link>
        </div>

        {/* Nav links — left-biased, right after logo */}
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side — login + CTA */}
        <div className="hidden md:flex items-center h-full">
          <Link
            href={`${APP_URL}/login`}
            className="font-label flex items-center h-[54px] px-5 text-[14px] tracking-[-0.04em] text-ink hover:text-ink-secondary transition-colors"
          >
            LOG IN
          </Link>
          <Link
            href={`${APP_URL}/login`}
            className="font-label flex items-center h-[54px] px-4 min-w-[118px] justify-center bg-surface-button text-white text-[14px] tracking-[-0.04em]"
          >
            BOOK A DEMO
          </Link>
        </div>

        {/* Mobile */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden ml-auto mr-6 p-2"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

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
            <Link href={`${APP_URL}/login`} className="font-label text-[14px] text-ink">
              LOG IN
            </Link>
            <Link
              href={`${APP_URL}/login`}
              className="font-label flex items-center justify-center h-[54px] bg-surface-button text-white text-[14px]"
            >
              BOOK A DEMO
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
