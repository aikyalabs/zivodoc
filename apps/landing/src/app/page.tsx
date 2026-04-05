import { Header } from '@src/components/header';
import { Hero } from '@src/components/hero';
import { LogoMarquee } from '@src/components/logo-marquee';
import { Problem } from '@src/components/problem';
import { Solution } from '@src/components/solution';
import { Stats } from '@src/components/stats';
import { Features } from '@src/components/features';
import { TechMarquee } from '@src/components/tech-marquee';
import { Testimonials } from '@src/components/testimonials';
import { CTA } from '@src/components/cta';
import { Footer } from '@src/components/footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LogoMarquee />
        <Problem />
        <Solution />
        <Stats />
        <Features />
        <TechMarquee />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
