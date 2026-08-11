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

### Save Point "ED04-final" — sphere dual-mapping fix + admin 3-factor login + deployment prep
- Sphere pole artifact final fix (`neon-sphere.tsx`) — previous cap-widening approach (`smoothstep(0.82,0.97)` + `capDetail`) still produced a soft greyish blob; root cause is geometric: equirectangular UV `atan(p.z,p.x)` is degenerate at Y-axis poles (all longitude meridians converge there). Any cap approach covers bad samples — it cannot replace them. Fix: **dual-mapping cross-fade** — second projection with poles on X axis; `poleBlend = smoothstep(0.55, 0.88, abs(p.y))` cross-fades between the two. Synthetic cap and `capDetail` removed entirely. Specular changed from screen-space falloff to normal-based `pow(ndl, 110.0)` tracking pointer via `lightDir`. Verified clean texture edge-to-edge at two rotation snapshots, no blob.
- Admin 3-factor login — `admin-auth.ts`/`api/admin/login/route.ts`/`admin/login/page.tsx`: username, password, and Code (PIN) all required; Code hashed with same scrypt scheme; single generic 401 for any credential failure; migration seeds default code on old credential files; `.env.admin-auth.json` regenerated. Credentials: Admin / App@dmin0123 / 2085. Verified in Chrome.
- Deployment prep — `Deployment/render.yaml` (Render Blueprint: rootDir=Deployment/app, build=`npm ci && npm run build`, start=`npm run start`), `Deployment/DEPLOY-README.md`, `Deployment/app/package.json` engines field (`>=18.17.0`). Fixes the `Cannot find module 'server.js'` error that appeared on Render.

### Save Point "ED04" — sphere pole fix + scroll-driven cube reveal + cards choreography + footer/visitor counter + admin auth-bypass fix + SQL schema
- Sphere pole "bald patch" fixed — `neon-sphere.tsx`: equirectangular UV mapping is degenerate at the poles, smearing source art into a visible radial starburst when a pole rotated into view. Pole-cap blend widened (`smoothstep(0.93,0.995,...)` → `smoothstep(0.82,0.97,...)`) plus a second finer noise octave (`capDetail`) so the wider cap still carries texture. Cursor specular retuned from a broad screen-space falloff (left a permanent hazy bloom centered on the ball at the pointer's default `(0,0)`) to a normal-based glint (`lightDir`/`ndl`/`pow(ndl,110.0)`) that tracks the pointer instead of sitting fixed on the surface
- Ash-text/cube-reveal rework — `CubeReveal` (`cube-reveal.tsx`) is now a `forwardRef` component exposing `setProgress(p: number)` via `useImperativeHandle`; every cube's opacity/transform/brightness-wave is driven directly off a scroll-derived progress value computed in `ash-text-section.tsx`'s RAF loop, replacing the old time-based CSS-transition-delay `active` boolean. **This is an API change from ED03** — outrunning the reveal by scrolling fast is no longer possible by construction, since section scroll position and reveal progress are the same number. Added `VH_FOR_CUBE` scroll budget constant; cube reveal now starts partway through the ash-fall (`fall > 0.25`)
- Mehrdad.png height trim — `cube-reveal.tsx` outer box changed to explicit `calc(100vw / IMAGE_ASPECT - HEIGHT_TRIM_PX)` with `overflow-hidden` (currently 96px trim), inner grid keeps full uncropped height so the portrait is never squeezed, surplus runs off the top under the existing mask gradient. **Not yet confirmed by user as satisfying the original "shrink" request** — see follow-ups
- Cards section sequential choreography — `cards-section.tsx`: fixed a "no fade-in" bug where `#DEF520` was painted on the outer non-animated wrapper instead of the animated `motion.section` (moved onto the animated element); restructured intro into four explicit sequential beats via named breakpoints (`BG_IN_END`, `WORD_IN_END`, `WORD_HOLD_END`, `WORD_OUT_END`, `CARDS_IN_END`) — background fades up → "Portfolio" pops in and holds → word fades/grows out → first card fades in only once the word is gone → card rail begins horizontal travel only after that card has arrived. Verified via live DOM opacity sampling at each breakpoint
- Footer (`footer.tsx`) — logos `IMG_SIZE` 133px → 88px with proportionally scaled border/radius/glow; Pristinenoire logo `objectFit: cover` → `contain` (was cropping edges); QR tile's duplicated padding (tile style + image style) collapsed to image-only. New visitor counter: `src/app/api/visitor-count/route.ts` persists `{ count, seenIds }` to `.env.visitor-count.json` (GET read-only, `POST { visitorId }` increments only if id not already seen); client generates/reads a UUID from `localStorage` key `ma-visitor-id` via `crypto.randomUUID()` and POSTs once per mount; displayed as a centered pill below the copyright line matching the "Back to top" pill style. Verified end-to-end (first-visit increment, no re-increment on reload, disk file stays in sync)
- **CRITICAL SECURITY FIX** — admin auth bypass: `app/admin/page.tsx` (unguarded, rendered dashboard directly) and `app/admin/(protected)/page.tsx` (properly guarded via the `(protected)` layout's server-component auth check) both resolved to `/admin`, since a Next.js route group doesn't change the URL — the unguarded duplicate silently shadowed the protected one, a full unauthenticated admin access bypass. Files were byte-identical; the unguarded duplicate deleted, guarded one is now the sole `/admin` route. Verified via curl: unauthenticated `GET /admin` now 307-redirects to `/admin/login`; login API 401/400 behavior confirmed already correct
- Admin logout fix — `admin-dashboard.tsx`: `handleLogout` used `router.push("/")` (soft navigation, could leave stale App Router cache so the guard didn't necessarily re-run); changed to `window.location.replace("/")` (hard navigation, forces guard re-evaluation, drops `/admin` from history so Back can't return to a logged-in view); removed now-unused `useRouter`
- New file `Development/Implementation/MAWebsiteDB.sql` — full MS SQL Server DDL migration target for the current on-disk JSON persistence layer: 15 tables, 8 FKs, 22 indexes, 43 CHECK constraints, 7 stored procedures (TRY/CATCH+ROLLBACK) covering admin login/session, atomic full-set replace of home-text sentences (explicit `DisplayOrder` column preserving array order, which cube-reveal's trigger logic depends on), Card/Project + ordered bullet-point upsert as one transactional unit, contact-form insert. `AdminUser.PasswordHash` preserves the existing scrypt "salt:hash" format — no plaintext passwords. `CardBulletPoint`/`ProjectBulletPoint` are new tables with no JSON precedent (admin panel is being extended to support bullets on cards/projects). **DDL only — nothing in the running app reads/writes this schema yet**; app still runs entirely on JSON files. `SmtpConfig.Password`/`SocialConfig.AccessToken` remain plain columns (mirrors existing JSON, not a new regression) with nullable `PasswordSecretRef`/`TokenSecretRef` columns as the intended future secrets-vault path

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

**Last Updated**: August 10, 2026 — Save Point "ED04-final" (sphere dual-mapping pole fix, admin 3-factor login, deployment prep)

### Known follow-ups from ED04
- Per-page SEO metadata for `/about` and `/projects` still uses the shared root metadata — both pages are `"use client"` components, so distinct per-page `<title>`/`<meta>` needs either a server-component conversion or a nested layout/metadata pattern. Not done.
- Recurring Windows dev-server bug: `.next` manifest files (`app-paths-manifest.json`, `webpack-runtime.js`, `page.js`, etc.) intermittently fail to open with `UNKNOWN`/`errno -4094`, forcing a `.next` cache clear + restart. Struck repeatedly again this session; root cause still unidentified. Same workaround each time: stop server, delete `.next`, restart.
- Mehrdad.png "shrink" request — height trim implemented (96px `HEIGHT_TRIM_PX` in `cube-reveal.tsx`) but user has not explicitly confirmed it satisfies the original ask. Full page width forces a certain height; a genuinely smaller portrait would require either narrowing below full width or cropping into the face — open decision, not yet resolved.
- `MAWebsiteDB.sql` migration to actually be used by the app is unstarted future work — the app still runs entirely on the JSON config files; the schema is DDL only.

### Known follow-ups from ED02 (carried forward)
- `Robo Left.jpeg` is a copyrighted film still (RoboCop) and was **not** used. `robo-left.png` is currently a mirrored copy of the right robot, standing in until an owned asset is supplied.
- The home-text item "2-" requested alongside "Designing and Analyse Website…" was left blank and never supplied.
