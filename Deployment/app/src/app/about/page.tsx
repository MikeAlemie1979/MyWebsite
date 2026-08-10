"use client";

import React, { useEffect, useState } from "react";
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { ThemeControl } from "@/components/landing/theme-control";
import { AboutHeadline } from "@/components/about/about-headline";
import { AboutBody } from "@/components/about/about-body";
import { Flashcards, FlashcardItem } from "@/components/about/flashcards";
import { Breadcrumbs } from "@/components/common/breadcrumbs";

interface AboutContent {
  headline: string;
  headlineFontFamily: string;
  headlineFontSize: number;
  headlineColor: string;
  body: string;
  bodyFontFamily: string;
  bodyFontSize: number;
  bodyColor: string;
  flashcards: FlashcardItem[];
}

const DEFAULT_CONTENT: AboutContent = {
  headline: "About Mike Alemie",
  headlineFontFamily: "Michroma",
  headlineFontSize: 24,
  headlineColor: "#ffffff",
  body: "Mike Alemie is an AI designer and database engineer focused on building beautiful, resilient systems. He blends engineering precision with creative intelligence to craft experiences that feel intentional. This page is editable via Admin.",
  bodyFontFamily: "Michroma",
  bodyFontSize: 12,
  bodyColor: "rgba(255,255,255,0.7)",
  flashcards: [
    { id: "fc1", imageUrl: null, title: "Flashcard", text: "Placeholder content — editable via Admin." },
    { id: "fc2", imageUrl: null, title: "Flashcard", text: "Placeholder content — editable via Admin." },
    { id: "fc3", imageUrl: null, title: "Flashcard", text: "Placeholder content — editable via Admin." },
  ],
};

export default function AboutPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/about-content")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setContent({
          headline: data.headline ?? DEFAULT_CONTENT.headline,
          headlineFontFamily: data.headlineFontFamily ?? DEFAULT_CONTENT.headlineFontFamily,
          headlineFontSize: data.headlineFontSize ?? DEFAULT_CONTENT.headlineFontSize,
          headlineColor: data.headlineColor ?? DEFAULT_CONTENT.headlineColor,
          body: data.body ?? DEFAULT_CONTENT.body,
          bodyFontFamily: data.bodyFontFamily ?? DEFAULT_CONTENT.bodyFontFamily,
          bodyFontSize: data.bodyFontSize ?? DEFAULT_CONTENT.bodyFontSize,
          bodyColor: data.bodyColor ?? DEFAULT_CONTENT.bodyColor,
          flashcards:
            Array.isArray(data.flashcards) && data.flashcards.length > 0
              ? data.flashcards
              : DEFAULT_CONTENT.flashcards,
        });
      })
      .catch(() => {
        // fall back to default content on error
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="relative w-full overflow-x-hidden page-top" style={{ backgroundColor: "var(--theme-bg)" }}>
      <Navigation />
      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: "About" }]} />
      {/* The styled headline below is admin-configurable, so the page's
          semantic H1 is kept separate and visually hidden. */}
      <h1 className="sr-only">About Mike Alemie</h1>
      <AboutHeadline
        headline={content.headline}
        fontFamily={content.headlineFontFamily}
        fontSize={content.headlineFontSize}
        color={content.headlineColor}
      />
      <AboutBody
        body={content.body}
        fontFamily={content.bodyFontFamily}
        fontSize={content.bodyFontSize}
        color={content.bodyColor}
      />
      <Flashcards cards={content.flashcards} />
      <Footer />
      <ThemeControl />
    </main>
  );
}
