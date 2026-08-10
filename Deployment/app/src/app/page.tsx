import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-sphere";
import { AshTextSection } from "@/components/landing/ash-text-section";
import { CardsSection } from "@/components/landing/cards-section";
import { ContentSection } from "@/components/landing/content-section";
import { ContactForm } from "@/components/landing/contact-form";
import { Footer } from "@/components/landing/footer";
import { ThemeControl } from "@/components/landing/theme-control";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

export default function LandingPage() {
  return (
    // overflow-x-clip (not -hidden): `hidden` promotes main to a scroll
    // container, which breaks the pinned horizontal cards section's sticky.
    // No page-top here: the DS band and hero must sit flush against the very
    // top of the page with no margin gap.
    <main className="relative w-full overflow-x-clip">
      <Navigation />
      {/* Landing H1 is present for SEO/AT but visually hidden, since the
          hero carries the brand mark graphically instead. */}
      <h1 className="sr-only">Mike Alemie — Ai Designer &amp; Database Engineer</h1>
      {/* Overlaid, not stacked, so it does not push the hero down. */}
      <div className="absolute top-0 left-0 z-30 pointer-events-auto">
        <Breadcrumbs trail={[{ label: "Home" }]} />
      </div>
      <HeroSection />
      <AshTextSection />
      <CardsSection />
      <ContentSection />
      <ContactForm />
      <Footer />
      <ThemeControl />
    </main>
  );
}
