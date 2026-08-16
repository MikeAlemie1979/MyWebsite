import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { TargetCursor } from "@/components/common/target-cursor";
import { HeroMouseTrail } from "@/components/landing/hero-mouse-trail";
import { warnIfLocalBackend } from "@/lib/google-config";

// Runs once per server process (not once per request — see the module-level
// guard inside), so this is the closest thing to a boot-time check available
// without enabling Next's experimental instrumentation hook. Printed to
// stdout specifically so it shows up in Render's own log tail: the local-file
// fallback silently working made a real deploy look fine right up until
// content vanished on the next redeploy, and the only place that ever said
// otherwise was a banner inside /admin nobody had a reason to open yet.
warnIfLocalBackend();

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mikealemie.com";
const TITLE = "Mike Alemie | AI Designer & Database Engineer";
const DESCRIPTION =
  "Mike Alemie is an AI designer and database engineer at Pristinenoire LLC, building resilient, intentional software systems — from architecture to interface.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | Mike Alemie" },
  description: DESCRIPTION,
  // Plain-language keywords and an unambiguous description help both
  // classic search crawlers and answer/generative engines (AEO/GEO) quote
  // this page correctly rather than paraphrasing from thinner signals.
  keywords: [
    "Mike Alemie",
    "AI designer",
    "database engineer",
    "Pristinenoire LLC",
    "software architecture",
    "web application design",
  ],
  authors: [{ name: "Mike Alemie" }],
  creator: "Mike Alemie",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // No dedicated favicon asset exists in this project; reusing the existing
  // brand logo avoids both a 404 on every page load and inventing a new,
  // unapproved icon asset.
  icons: { icon: "/images/pristinenoire-logo.png" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Mike Alemie",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/images/mehrdad.png", width: 1840, height: 913, alt: "Mike Alemie" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/mehrdad.png"],
  },
};

// JSON-LD Person schema — the most direct signal for answer/generative
// engines (ChatGPT, Perplexity, Google's AI Overviews) that quote a person's
// role and affiliation from structured data rather than inferring it from
// prose, and it's what backs the "who is Mike Alemie" style query.
const PERSON_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mike Alemie",
  alternateName: "Mehrdad Mike Alemie",
  jobTitle: "AI Designer & Database Engineer",
  url: SITE_URL,
  worksFor: { "@type": "Organization", name: "Pristinenoire LLC" },
};

// Person alone answers "who is Mike Alemie" but leaves "what is Pristinenoire
// LLC" and "what is this site" with nothing structured to quote. Organization
// and WebSite round those out — the three together are what a generative
// engine needs to answer either a person-scoped or a company-scoped query
// about this site without falling back to paraphrasing prose.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pristinenoire LLC",
  url: SITE_URL,
  founder: { "@type": "Person", name: "Mike Alemie" },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Mike Alemie",
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" data-motion="visible">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <HeroMouseTrail />
          <TargetCursor />
        </ThemeProvider>
      </body>
    </html>
  );
}
