"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useTheme } from "@/context/theme-context";

interface ProjectItem {
  id: string;
  title: string;
  briefInfo: string;
  approxPrice: string;
  imageUrl?: string | null;
  order: number;
}

const CARD_COUNT = 7;

const PLACEHOLDER_PROJECTS: ProjectItem[] = Array.from({ length: CARD_COUNT }, (_, i) => ({
  id: `p${i + 1}`,
  title: `Project ${i + 1}`,
  briefInfo: "Placeholder project description.",
  approxPrice: "$—",
  imageUrl: null,
  order: i + 1,
}));

function ProjectCard({ project, index }: { project: ProjectItem; index: number }) {
  return (
    <motion.div
      className="motion-el relative flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm h-full flex flex-col justify-end overflow-hidden group cursor-pointer"
      style={{ padding: 30, width: "min(80vw, 420px)" }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 1.0 }}
      transition={{ scale: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
    >
      {project.imageUrl && (
        <Image
          src={project.imageUrl}
          alt={project.title}
          fill
          className="object-cover"
          style={{ opacity: 0.35 }}
          sizes="(max-width: 768px) 80vw, 420px"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_0%,rgba(124,255,240,0.15),transparent_70%)]" />
      <div className="relative z-10">
        <p className="text-eyebrow mb-3" style={{ opacity: 0.55 }}>
          {String(index + 1).padStart(2, "0")} / {String(CARD_COUNT).padStart(2, "0")}
        </p>
        <h3 className="text-[20px] font-medium tracking-wide mb-3 opacity-95">{project.title}</h3>
        <p className="text-[13px] leading-relaxed opacity-80">{project.briefInfo}</p>
        <p className="font-display text-[14px] tracking-wide mt-6 opacity-95">{project.approxPrice}</p>
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
          const sorted = [...data.projects].sort((a, b) => a.order - b.order);
          setProjects(sorted);
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
          <ProjectCard key={project.id} project={project} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full -mx-[30px]"
      style={{ height: `${CARD_COUNT * 90}vh` }}
    >
      <section className="sticky top-0 h-screen w-full overflow-hidden flex items-center" aria-label="Projects and prices">
        <motion.div ref={trackRef} className="flex gap-8 h-[70vh] pl-[30px] pr-[30px] w-max" style={{ x }}>
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </motion.div>
      </section>
    </div>
  );
}
