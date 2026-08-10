# Roadmap

Progress tracker for Mike Alemie Website. One line per page/feature. Updated as phases complete.

---

## Completed

- Landing Home Page — `Deployment/app/src/app/page.tsx` + `src/components/landing/` (navigation with scroll-parallax branding text that shrinks and rotates vertical on scroll, hero-sphere 3D rotating sphere, ash-text-section GSAP scroll-pin particle animation, cards-section, content-section, contact-form with phone validation, footer). Nav links fixed to work cross-page.
- Theme System — Dark/Warm/Bright themes + motion/mouse-trail accessibility toggles, `src/context/theme-context.tsx`, `src/components/landing/theme-control.tsx`
- Admin: Login/Auth (Local User/Pass) — credentials set (username Admin), `src/app/admin/login/page.tsx` with Back to Home link
- Admin Dashboard — `src/components/admin/admin-dashboard.tsx`, Log Out button; sidebar redesigned into three groups: Pages (About, Projects & Prices), Homepage Sections (nested under Home — Ash Text, Cards), System (Email SMTP, Social Media), each with icons and descriptions
- Admin SMTP Settings — `src/components/admin/smtp-settings-panel.tsx` + `src/app/api/admin/smtp-config/route.ts` (GET/POST, config stored in `.env.smtp.json`)
- Admin: Home Page text manager — `src/components/admin/home-text-manager.tsx`
- Admin: Cards manager — `src/components/admin/cards-manager.tsx`
- Admin: About page manager — `src/components/admin/about-manager.tsx`
- Admin: Projects/Prices manager — `src/components/admin/projects-manager.tsx`
- Admin: Social media posting panel — `src/components/admin/social-media-panel.tsx`
- Projects and Prices Page — cards redesigned to match Home page's floating Cards section style (glass cards, idle rotation, hover glow, scroll-reveal stagger), replacing old horizontal drag-slider
- Cinematic redesign pass — `globals.css` gained vignette/film-grain/ambient-glow/fluid-type/gradient-text utilities; Hero rebuilt with giant ghosted wordmark, drifting ambient glow blobs, animated gradient headline "Systems, Sculpted.", scroll cue, starfield backdrop, orbiting skill/virtue labels ("THE PERSEVERANCE", "THE ARCHITECTURE", etc.); Content/Philosophy section given massive display heading with gradient highlight; Cards section given matching eyebrow+heading treatment

- Hero depth-parallax — Hero section (`hero-sphere.tsx`) given scroll-linked depth-layer parallax via Framer Motion `useScroll`/`useTransform` (starfield/glow drift slowest), respecting `motionHidden`/reduced-motion
- Motion timing pass — card hover states (`cards-section.tsx`, `sliding-cards.tsx`, `flashcards.tsx`) given explicit Premium-tier transitions (350ms, cubic-bezier(0.4,0,0.2,1), 0% overshoot) replacing Framer's default spring, for consistent non-bouncy hover feel across the site
- Typography system — `globals.css` now defines `--font-display` (Michroma, scoped via `.font-display`/`.text-display`/`.text-eyebrow` to headlines, eyebrows, and the nav wordmark) paired with `--font-body` (Inter) for body copy, a modular type scale (`--size-sm/base/md/lg/xl`), and a `.prose` 60ch measure utility; cramped 10-13px card/caption text across landing + about + admin bumped to 12-15px with improved line-height and contrast (notably: contact-form error text, admin sidebar group descriptions)
- Hero sphere reintroduced — `neon-sphere.tsx` now texture-maps `/images/sphere-ref.png` via equirectangular UV mapping instead of pure procedural noise; pole-pinch fixed with a blend-to-uniform-colour cap (not a texel sample, which risked landing on a black crack); "solar convection" domain-warp + continuous UV drift makes the surface colour migrate across the whole ball over time (sun-like), with per-pixel granulation brightness/hue drift; single-owner CSS opacity fade (shader-side `uFade` removed) keeps the ball and its glow ring fading in together; horizontal offset in `hero-sphere.tsx` is now `+220px` from center (`sphereXWithOffset`)

### Save Point "ED03" — sphere texture-map + ash/cube reveal + theming + SEO pass
- Sphere: texture-mapped from `Sphere.png` (see above), moved incrementally to `+220px` right of center, colour migration + sun-surface granulation, single fade owner, no pole black-spot
- Ash section (`ash-text-section.tsx`): fixed a stale `.env.home-text.json` (4 sentences, missing the "MEHRDAD MIKE ALEMIE." cue) that was silently overriding the real 8-sentence set and breaking the cube-reveal trigger — reset to the full 8 sentences and synced `DEFAULT_CONFIG` in `api/admin/home-text/route.ts` so a fresh deploy can't regress the same way
- Cube reveal (`cube-reveal.tsx`) moved to mount *inside* `ash-text-section.tsx`'s pinned viewport (driven imperatively by the RAF loop via a `active` prop) instead of as a separate section below it, so it appears before the section releases scroll; `Mehrdad.png` re-synced from `Sprints/Website/Mehrdad.png` (twice, most recently 2026-08-10)
- Mehrdad reveal sizing: iterated to full page width (`w-screen`, bottom-anchored) with a top mask-gradient (`linear-gradient(to bottom, transparent → #000)`) that dissolves the vertical overflow into the black background rather than cropping it, keeping the 1840/913 aspect ratio intact throughout — resolves the "full width AND bottom-flush AND no distortion" constraint, which is not satisfiable without a mask
- Ash-left.png / ash-right.png flanking figures raised to `z-20` (were `z-0`) so they render in front of the cube-reveal overlay (`z-10`) instead of being occluded by it
- Theme colours: Warm `#4D1E02 / #782F00 / #E35900`, Bright `#BFB681 / #DBD094 / #F7EBA7` (`globals.css` `[data-theme]` blocks + radial-gradient body background)
- Cards section (`cards-section.tsx`): rebuilt with a two-phase scroll — a word-zoom "Portfolio" intro phase, then a card-track phase; cards now full section height (`h-full`, was `h-[58vh]`)
- Projects page (`sliding-cards.tsx`): rebuilt as the same sticky-pinned scroll-linked rail as the landing Cards section — Apple-style, direction-reversible since `x` is driven directly off `scrollYProgress`; `projects/page.tsx`'s `main` fixed from `overflow-x-hidden` → `overflow-x-clip` (same sticky-breaking bug as the landing page, just not yet applied there)
- M-menu "Disable mouse trail" now actually wired — `hero-mouse-trail.tsx` reads `useTheme().mouseTrailDisabled` and clears/skips the canvas loop when set (previously had no effect)
- Admin dashboard given a `Breadcrumbs` trail (Home / Admin)
- SEO/AEO/GEO pass: `layout.tsx` metadata expanded (metadataBase, OG, Twitter card, `Person` JSON-LD); `robots.ts` and `sitemap.ts` added; HSTS + security headers added to `next.config.js`, gated behind `ENABLE_HSTS=true` (off by default — TLS is host-managed)
- Contact form toggle bug fixed: `Toggle` component was missing `type="button"`, so it defaulted to `type="submit"` and fired form validation on click inside `contact-form.tsx`

### Save Point "Ed01" — landing polish pass
- Top star band — canvas particle field (2500 dots/sparkles, 1–7px, independent drift + flicker) spanning full width from 200px down; nav wordmark letter-collapse slowed 2x
- Section colour blocking — Cards section on `#DEF520`, Philosophy section on an animated 5-stop wave (`#DEF520 → #E9FA86 → white → …`, 20s loop); black gaps between sections removed
- Philosophy heading — per-word randomized colour cycling through a 6-colour palette with staggered "wave" delays
- Nav dot — 2x larger, flashing `#DEF520` / white / orange
- Footer — logo + QR 1.5x smaller and logo swapped to `Pristinenoire LLC.png`; social icons 3x larger; copyright moved to top-centre with Back-to-top; nav wordmark now freezes at the footer's top border

### Save Point "ED02" — interaction + motion overhaul
- Horizontal cards section — `cards-section.tsx` rebuilt as a pinned horizontal-scroll track: 7 cards, each with a full-height explanation panel on the left; vertical scroll drives horizontal travel then releases downward. Travel distance measured from real track width (resize-aware). Fixed `main`'s `overflow-x-hidden` → `overflow-x-clip`, which was silently promoting `main` to a scroll container and breaking `position: sticky`
- Hero neon sphere — `neon-sphere.tsx`, an original GLSL shader sphere (simplex noise + domain warping, 3 neon colours, fresnel rim, pointer-tracked specular). Motion driven by three mutually irrational rates so it never visibly loops
- Sphere typography — `sphere-typography.tsx` scatters 27 phrases in 13 decorative faces around the sphere; fade in → 5s hold → fade out with letter-spacing opening up; angle-bucket + phrase history prevents obvious repetition
- Hero mouse trail — `hero-mouse-trail.tsx`, canvas rope trail confined to the top 160px band; staggered per-particle chase lag, crisp within 3px of the pointer, converges and vanishes after 4s idle
- Target cursor — `target-cursor.tsx` replaces the system cursor site-wide with a two-ring crosshair + live X/Y; clicks scatter 5 red 1–8px dots that fade over 4s. Pointer position written via ref, not state, to avoid re-rendering on mousemove
- Ash section — `ash-text-section.tsx` rewritten to the 7-sentence manifesto: scroll-scrubbed per-character assembly (particles dart in from off-screen at individual arrival times), then ash-fall dissolution with drift, embers, and fade completing before the next section
- Philosophy robots — `robo-left.png` / `robo-right.png` keyed to transparency via edge flood-fill; revealed on scroll with a tube-light flicker that settles to steady
- Philosophy heading — words now fly in alternating left/right; `#6362B8` added to the colour-cycle palette
- Navigation — `breadcrumbs.tsx` added to all three pages; every page has an H1 (visually hidden on landing and about)
- Page top margin reduced 35px → 30px

## In Progress

- About Page — content/build status pending final review
- Admin: Social media posting (Instagram + Facebook) — connect live APIs, panel UI built

## Not Started

- Google Sheet database integration (with app-side formatting layer)
- Google Drive storage integration
- DDOS + MMAT security hardening
- Production hosting setup (generic web host provider)

---

**Last Updated**: August 10, 2026 — Save Point "ED03" (sphere texture-map + colour migration, ash/cube-reveal restructure, theme colours, cards word-zoom + full-height, Projects rail, mouse-trail toggle wired, admin breadcrumbs, SEO/AEO/GEO pass)

### Known follow-ups from ED03
- Per-page SEO metadata for `/about` and `/projects` still uses the shared root metadata — both pages are `"use client"` components, so distinct per-page `<title>`/`<meta>` needs either a server-component conversion or a nested layout/metadata pattern. Not done.
- Recurring Windows dev-server bug: `.next/server/webpack-runtime.js` (and other `.next` manifest files) intermittently fail to open with `UNKNOWN`/`errno -4094`, forcing a `.next` cache clear + restart. Ruled out orphaned Node processes as the cause; root cause still unidentified (suspect AV real-time scanning or the project path's spaces — `C:\M E H R D A D\...`). Recurred again during this save-point's own verification pass.
- The "not synching spots" sphere note from mid-session was never clarified with the user — no shader change was made for it beyond the colour-migration fix already logged above.

### Known follow-ups from ED02 (carried forward)
- `Robo Left.jpeg` is a copyrighted film still (RoboCop) and was **not** used. `robo-left.png` is currently a mirrored copy of the right robot, standing in until an owned asset is supplied.
- The home-text item "2-" requested alongside "Designing and Analyse Website…" was left blank and never supplied.
