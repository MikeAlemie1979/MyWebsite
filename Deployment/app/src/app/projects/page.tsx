import type { Metadata } from "next";
import { Navigation } from "@/components/landing/navigation";
import { SlidingCards } from "@/components/projects/sliding-cards";
import { Footer } from "@/components/landing/footer";
import { ThemeControl } from "@/components/landing/theme-control";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

const TITLE = "Projects & Prices";
const DESCRIPTION =
  "Recent AI design and database engineering projects by Mike Alemie, with approximate pricing for each.";

// Own title/description/OG image rather than inheriting the homepage's, so a
// classic search result and a generative-engine answer about pricing or past
// work both quote this page's content instead of the Person bio on "/".
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/projects" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/projects" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ProjectsPage() {
  return (
    // overflow-x-clip (not -hidden): `hidden` promotes main to a scroll
    // container, which breaks the pinned horizontal rail's position:sticky.
    <main className="relative w-full overflow-x-clip page-top" style={{ backgroundColor: "var(--theme-bg)" }}>
      <Navigation />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "Projects & Prices" }]} />
      <section className="page-margin section-spacing">
        <h1 className="text-[28px] tracking-[0.15em] uppercase opacity-95 mb-3">
          Projects &amp; Prices
        </h1>
        <p className="text-[13px] opacity-70 max-w-xl">
          A selection of recent projects with approximate pricing. Scroll to explore.
        </p>
      </section>
      <section className="page-margin section-spacing" aria-label="Projects and prices list">
        <SlidingCards />
      </section>
      <Footer />
      <ThemeControl />
    </main>
  );
}
