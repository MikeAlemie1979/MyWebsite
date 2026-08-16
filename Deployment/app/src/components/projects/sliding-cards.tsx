"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";

interface ProjectItem {
  id: string;
  cardId: number;
  details: string;
  cardLogoNumber: number;
  minDevCost: string;
  imageUrl?: string | null;
}

const PLACEHOLDER_PROJECTS: ProjectItem[] = [
  { id: "p1", cardId: 1, details: "Placeholder project details.", cardLogoNumber: 1, minDevCost: "$—", imageUrl: null },
];

function ProjectCard({ project, index, total }: { project: ProjectItem; index: number; total: number }) {
  return (
    <motion.div
      className="motion-el relative flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm h-full flex flex-col overflow-hidden group cursor-pointer"
      style={{ width: "min(80vw, 420px)" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 1.0 }}
      transition={{ scale: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_0%,rgba(124,255,240,0.15),transparent_70%)] pointer-events-none" />

      {/* Logo — 40% of card height */}
      <div className="relative flex items-center justify-center p-6 border-b border-white/10" style={{ height: "40%" }}>
        {project.imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={project.imageUrl}
              alt={`Project ${index + 1} logo`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 80vw, 420px"
            />
          </div>
        ) : (
          <span className="text-xs opacity-40">No logo</span>
        )}
      </div>

      {/* Details — 50% of card height */}
      <div className="relative flex flex-col justify-center gap-3 px-6 py-4 overflow-hidden" style={{ height: "50%" }}>
        <p className="text-eyebrow" style={{ opacity: 0.55 }}>
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </p>
        {/* h2, not h3: the page's h1 ("Projects & Prices") has nothing
            between it and a project's own heading in the DOM, which is a
            heading-order skip Lighthouse flags directly. */}
        <h2 className="sr-only">Project {index + 1}</h2>
        <p className="text-[13px] leading-relaxed opacity-80">{project.details}</p>
      </div>

      {/* Development Cost — 10% of card height */}
      <div
        className="relative flex items-center justify-center px-6 border-t border-white/10"
        style={{ height: "10%" }}
      >
        <p className="font-display text-[14px] tracking-wide opacity-95">{project.minDevCost}</p>
      </div>
    </motion.div>
  );
}

/**
 * Apple-style pinned horizontal rail: the wrapper is tall, the viewport-height
 * panel sticks to the top, and the track's x-position is driven directly by
 * scroll progress (not a one-shot animation) — so scrolling down rolls the
 * rail right-to-left and scrolling back up reverses it automatically, the
 * same mechanism as the landing page's Selected Work section.
 */
export function SlidingCards() {
  const [projects, setProjects] = useState<ProjectItem[]>(PLACEHOLDER_PROJECTS);
  const { motionHidden } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/projects")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
        }
      })
      .catch(() => {
        // fall back to placeholder projects on error
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxX]);

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      setMaxX(Math.max(0, track.scrollWidth - window.innerWidth + 60));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [projects]);

  // Reduced motion: fall back to the original static grid rather than pin
  // the page for a scroll-driven rail the user has asked to avoid.
  if (motionHidden) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" aria-label="Projects and prices">
        {projects.map((project, i) => (
          <div key={project.id} className="h-[420px]">
            <ProjectCard project={project} index={i} total={projects.length} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full -mx-[30px]"
      style={{ height: `${Math.max(projects.length, 1) * 90}vh` }}
    >
      <section className="sticky top-0 h-screen w-full overflow-hidden flex items-center" aria-label="Projects and prices">
        <motion.div ref={trackRef} className="flex gap-8 h-[70vh] pl-[30px] pr-[30px] w-max" style={{ x }}>
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} total={projects.length} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
