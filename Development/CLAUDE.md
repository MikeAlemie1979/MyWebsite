# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Mike Alemie Website** is a Next.js-based website application built for Pristinenoire LLC. The project uses a modular, page-by-page development approach following the Modular Agile Iterative (MAI) model.

- **Status**: V0.01 α (Alpha) - Initial Release 2026
- **Tech Stack**: Next.js, React, TypeScript, Tailwind CSS
- **Primary Application Code**: `Deployment/app/`
- **Architecture Guidelines**: `Instructions/Gen Architecture/SysArch.md`
- **UI/UX Specifications**: `Instructions/Gen UI/UIUX.md`
- **Application Story**: `Instructions/Epic/AppStory.md`

---

## Project Structure

```
Mike Alemie Website/
├── Deployment/app/              # Main Next.js application (production-ready code)
│   ├── src/
│   │   ├── app/                 # Next.js App Router directory
│   │   │   └── api/             # API routes (Next.js serverless functions)
│   │   └── components/          # Reusable React components
│   ├── next.config.js          # Next.js configuration
│   ├── package.json            # Dependencies (if exists)
│   └── .next/                  # Build output (generated)
├── Development/                 # Development resources
│   └── Implementation/          # Implementation tracking and artifacts
├── Instructions/                # Project governance and guidelines
│   ├── Gen Architecture/SysArch.md      # System architecture blueprint
│   ├── Gen UI/UIUX.md                   # UI/UX design specifications
│   └── Epic/AppStory.md                 # Application story and requirements
├── Sprints/                     # Sprint organization
│   ├── Website/                 # Website-level assets (logo, clips, images)
│   └── Pages/                   # Page-specific designs, images, clips
└── CLAUDE.md                    # This file
```

---

## Development Workflow

### Key Commands (Next.js)

**Install Dependencies**
```bash
cd Deployment/app
npm install
# or
yarn install
# or
pnpm install
```

**Development Server**
```bash
cd Deployment/app
npm run dev
# Runs on http://localhost:3000
```

**Build for Production**
```bash
cd Deployment/app
npm run build
```

**Start Production Build**
```bash
cd Deployment/app
npm run start
```

**Linting and Type Checking**
```bash
cd Deployment/app
npm run lint
# or for TypeScript checking:
npx tsc --noEmit
```

---

## Architecture & Design Principles

### Layered Architecture
The application follows a layered architecture as defined in `SysArch.md`:
1. **UI/UX Layer** - Visual design and user experience
2. **Frontend Layer** - React components, Next.js pages
3. **API Layer** - Next.js API routes (serverless functions)
4. **Security & Compliance Layer** - Authentication, authorization
5. **Data Persistence** - Configuration files, database integration (if needed)

### Development Approach
- **Modular Agile Iterative (MAI)**: Page-by-page development with iterative refinement
- **Component-Based**: Reusable React components in `src/components/`
- **API Routes**: Server-side logic in `src/app/api/`
- **Tailwind CSS**: Utility-first CSS framework for styling

### Governance Rules (CRITICAL)
- **No architectural or UI/UX modification without approval** - changes to system design require review
- **Do not invent workflows or new design** - follow established patterns in `UIUX.md`
- **Prevent architectural drift** - maintain consistency with defined architecture
- **Follow Roadmap.md** in `Development/Implementation/` to track completed phases

---

## Current Implementation

### Existing Components & Features

**Landing Home Page** (COMPLETE, cinematic redesign; hero sphere removed) — `src/app/page.tsx` + `src/components/landing/`
- `navigation.tsx` (scroll-parallax branding text that shrinks and rotates vertical on scroll; links fixed to work cross-page; wordmark/nav pinned to `.font-display`), `hero-sphere.tsx` (Hero section — starfield backdrop, ambient glow blobs, scroll cue, scroll-linked depth-layer parallax via Framer Motion `useScroll`/`useTransform`, plus `neon-sphere.tsx` rendered at `sphereXWithOffset` = center `+220px`), `neon-sphere.tsx` (GLSL shader sphere, texture-mapped from `/images/sphere-ref.png` via equirectangular UV mapping with a pole-pinch blend-to-colour cap, "solar convection" domain-warp + continuous UV drift for full-surface colour migration, single CSS-opacity fade owner), `ash-text-section.tsx` (GSAP scroll-pin particle animation — the only GSAP ScrollTrigger usage in the app — plus the `CubeReveal` Mehrdad.png reveal mounted inside its pinned viewport, triggered via an `active` prop off the same RAF loop, full-page-width with a top mask-gradient into the section background), `cards-section.tsx` (two-phase: word-zoom intro then a pinned horizontal card-track, full-height cards), `content-section.tsx`, `contact-form.tsx` (phone validation), `footer.tsx`, `theme-control.tsx`
- Cinematic redesign: `globals.css` vignette/film-grain/ambient-glow/fluid-type/gradient-text utilities; Hero rebuilt with giant ghosted wordmark, drifting ambient glow blobs, animated gradient headline "Systems, Sculpted.", scroll cue, starfield backdrop, orbiting skill/virtue labels; Content/Philosophy section given massive display heading with gradient highlight; Cards section given matching eyebrow+heading treatment
- Typography system: `globals.css` defines `--font-display` (Michroma, scoped via `.font-display`/`.text-display`/`.text-eyebrow`) paired with `--font-body` (Inter) for body copy, a modular type scale (`--size-sm/base/md/lg/xl`), and a `.prose` 60ch measure utility
- Motion: Framer Motion is the primary motion system (entrances, hover, hero parallax) — hover states across cards use explicit Premium-tier timing (350ms, cubic-bezier(0.4,0,0.2,1)); GSAP ScrollTrigger stays scoped to `ash-text-section.tsx`'s pin/dissolve effect only — do not introduce a third animation system

**Theme System** (COMPLETE) — `src/context/theme-context.tsx`
- Dark / Warm / Bright themes + motion and mouse-trail accessibility toggles

**Projects & Prices Page** (COMPLETE) — cards redesigned to match Home page's floating Cards section style (glass cards, idle rotation, hover glow, scroll-reveal stagger), replacing the old horizontal drag-slider

**Admin Login/Auth** (COMPLETE) — `src/app/admin/login/page.tsx` (credentials set, username Admin; Back to Home link)

**Admin Dashboard** (`src/components/admin/`)
- `admin-dashboard.tsx` - Main admin dashboard component (dark theme, Tailwind CSS; Log Out button). Sidebar redesigned into three groups: Pages (About, Projects & Prices), Homepage Sections (nested under Home — Ash Text, Cards), System (Email SMTP, Social Media), each with icons and descriptions
- `smtp-settings-panel.tsx` - SMTP email configuration panel (working)
- `home-text-manager.tsx`, `cards-manager.tsx`, `about-manager.tsx`, `projects-manager.tsx`, `social-media-panel.tsx`

**API Routes** (`src/app/api/`)
- `admin/smtp-config/route.ts` - SMTP configuration management (GET/POST)
  - Stores config in `.env.smtp.json`
  - Validates required fields
  - Returns configuration data

### In Progress
About page content finalization; social media posting panel needs live Instagram/Facebook API connections. See `Development/Implementation/Roadmap.md` for status.

### Tech Stack Details
- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with utility classes
- **Client Components**: Marked with `"use client"` directive
- **API Pattern**: Next.js API Routes (serverless functions)

---

## Important Guidelines

### Before Making Changes
1. **Check the Roadmap**: Review `Development/Implementation/Roadmap.md` to understand which phase is complete
2. **Review Architecture**: Read `Instructions/Gen Architecture/SysArch.md` for architectural constraints
3. **Check UI/UX Spec**: Follow `Instructions/Gen UI/UIUX.md` for design consistency
4. **No Architectural Changes**: Any changes to system layers or overall design need approval

### When Adding Features
- **New Pages**: Add to `src/app/` following Next.js App Router conventions
- **New Components**: Create in `src/components/` with TypeScript support
- **New API Routes**: Add to `src/app/api/` directory structure
- **Styling**: Use Tailwind CSS classes (consistent with existing dark theme)
- **TypeScript**: Always maintain type safety - interfaces defined inline or in separate files

### File Naming Conventions
- Components: PascalCase (e.g., `AdminDashboard.tsx`)
- API routes: kebab-case in paths (e.g., `smtp-config/route.ts`)
- Utilities: camelCase (e.g., `helpers.ts`)

---

## Asset & Sprint Organization

- **Website Assets**: `Sprints/Website/` stores website logo, clips, videos
- **Page Assets**: `Sprints/Pages/` stores design files, images, clips per page
- **Temporary Files**: Use `Deployment/` for build artifacts and temporary work
- **Final Code**: All deployable code in `Deployment/app/src/`

---

## References & Further Reading

- **System Architecture**: `Instructions/Gen Architecture/SysArch.md`
- **UI/UX Specifications**: `Instructions/Gen UI/UIUX.md`
- **Application Requirements**: `Instructions/Epic/AppStory.md`
- **Progress Tracking**: `Development/Implementation/Roadmap.md`
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/

---

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `cd Deployment/app && npm run dev` |
| Build for production | `cd Deployment/app && npm run build` |
| Type check | `cd Deployment/app && npx tsc --noEmit` |
| Install deps | `cd Deployment/app && npm install` |

---

**Last Updated**: August 10, 2026 — Save Point "ED03"

### ED03 landmarks (landing page)
- `main` must stay `overflow-x-clip`, never `overflow-x-hidden`, on **every** page with a pinned/sticky section — `hidden` promotes it to a scroll container and silently breaks `position: sticky`. Applies to the landing page and `projects/page.tsx` (both fixed).
- Pinned scroll sections: `cards-section.tsx` (word-zoom intro, then 7 cards, vertical scroll → horizontal travel, full section height), `ash-text-section.tsx` (8 manifesto sentences, scroll-scrubbed particle assembly, ash-fall dissolution, then the `CubeReveal` Mehrdad.png reveal fades in — all inside the same pinned viewport, driven imperatively via RAF, not React state), and `sliding-cards.tsx` on `/projects` (same rail mechanism, bidirectional by construction since `x` tracks `scrollYProgress` directly). All use a tall wrapper + `sticky top-0 h-screen` inner.
- Ash section's real content source is `.env.home-text.json` via `/api/admin/home-text` (falls back to `DEFAULT_SENTENCES` in `ash-text-section.tsx` / `DEFAULT_CONFIG` in the API route) — if sentences look wrong or short, check the JSON file on disk first, not just the component code.
- Global overlays live in `layout.tsx`: `TargetCursor` (replaces the system cursor; hides it via `cursor: none` under a `hover:hover` media query) and `HeroMouseTrail` (top 160px band only, respects `useTheme().mouseTrailDisabled`).
- `neon-sphere.tsx` is an original GLSL shader — do not swap it for a copied third-party sphere. Texture-mapped from `/images/sphere-ref.png` (equirectangular UV); pole-pinch is blended to a uniform colour, never a texel sample (a texel can land on a black crack in the source art). Use `NormalBlending`, not additive: additive pushes the rim/filament/specular terms past 1.0 and clips the ball to flat white. Fade-in is owned solely by the wrapper's CSS `opacity` transition — do not reintroduce a shader-side `uFade`.
- `Toggle` (`common/toggle.tsx`) must keep `type="button"` — without it, any toggle inside `<form>` (e.g. contact form's callback toggle) defaults to `type="submit"` and fires validation on click.
- Windows dev server: `.next` manifest files (`webpack-runtime.js`, `react-loadable-manifest.json`, etc.) intermittently throw `UNKNOWN`/`errno -4094` on open. Not an orphaned-process issue (checked). Fix each time: stop the server, delete `.next`, restart.
**Project Status**: V0.01 α (Alpha)
