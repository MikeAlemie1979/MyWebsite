import type { Metadata } from "next";

const TITLE = "About";
const DESCRIPTION =
  "About Mike Alemie — an AI designer and database engineer at Pristinenoire LLC, blending engineering precision with creative intelligence.";

// page.tsx is a client component ("use client", for the admin-editable
// content fetch), and Next.js only reads `metadata` from server components —
// so this sits in the route's layout instead, the standard way to attach
// per-page metadata to a client page.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/about" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
