import type { Metadata } from 'next';
import { Inter, Fragment_Mono, Silkscreen } from 'next/font/google';
import { SmoothScroll } from '@src/components/smooth-scroll';
import { CustomCursor } from '@src/components/custom-cursor';
import './globals.css';

// Body font — closest free match to PP Object Sans
const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
});

// Mono font — for labels, nav, buttons (PP Supply Mono role)
const fragmentMono = Fragment_Mono({
  variable: '--font-mono-label',
  subsets: ['latin'],
  weight: '400',
});

// Pixel/bitmap font — for stat numbers (PP NeueBit role)
const silkscreen = Silkscreen({
  variable: '--font-pixel',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'SaaS Template — Ship in Days, Not Months',
  description:
    'Production-ready monorepo with authentication, RBAC, multi-tenancy, and full-stack type safety. NestJS, React, PostgreSQL.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fragmentMono.variable} ${silkscreen.variable} antialiased`}
    >
      <body>
        <SmoothScroll />
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
