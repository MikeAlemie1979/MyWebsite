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
5. **Data Persistence** - Document-store abstraction (`src/lib/store.ts`): flat `.env.*.json` files (`fs` backend, default/local) or Google Sheets as the database (`sheets` backend, auto-selected once configured) with a schema-driven column mapping (`src/lib/sheet-schema.ts`). Uploaded images go to a non-public local `uploads/` directory served per-request via `/api/media/local/[...path]` (not `public/uploads/**`, which `next start` snapshots at boot and never rescans), or to Google Drive (`src/lib/media.ts`) via a separate OAuth connection (`src/lib/google-oauth.ts`) — the Sheets service account cannot upload to Drive on personal accounts (see landmarks below) and is Sheets-only

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
- `navigation.tsx` (scroll-parallax branding text that shrinks and rotates vertical on scroll; links fixed to work cross-page; wordmark/nav pinned to `.font-display`), `hero-sphere.tsx` (Hero section — starfield backdrop, ambient glow blobs, scroll cue, scroll-linked depth-layer parallax via Framer Motion `useScroll`/`useTransform`, plus `neon-sphere.tsx` rendered at `sphereXWithOffset` = center `+220px`), `neon-sphere.tsx` (GLSL shader sphere, texture-mapped from `/images/sphere-ref.png` via equirectangular UV mapping with a dual-mapping cross-fade pole fix — second projection with poles on X axis, `poleBlend = smoothstep(0.55, 0.88, abs(p.y))` — replacing the old cap/`capDetail` approach; "solar convection" domain-warp + continuous UV drift for full-surface colour migration, single CSS-opacity fade owner, normal-based pointer-tracked specular glint), `ash-text-section.tsx` (GSAP scroll-pin particle animation — the only GSAP ScrollTrigger usage in the app — plus the `CubeReveal` Mehrdad.png reveal mounted inside its pinned viewport, progress-driven off the same RAF loop via `setProgress()`, full-page-width with a top mask-gradient into the section background), `cards-section.tsx` (sequential scroll choreography: background fade → "Portfolio" word pop/hold/fade → first card fade-in → horizontal card-track travel, full-height cards), `content-section.tsx`, `contact-form.tsx` (phone validation), `footer.tsx` (88px logo tiles, visitor counter pill), `theme-control.tsx`
- Cinematic redesign: `globals.css` vignette/film-grain/ambient-glow/fluid-type/gradient-text utilities; Hero rebuilt with giant ghosted wordmark, drifting ambient glow blobs, animated gradient headline "Systems, Sculpted.", scroll cue, starfield backdrop, orbiting skill/virtue labels; Content/Philosophy section given massive display heading with gradient highlight; Cards section given matching eyebrow+heading treatment
- Typography system: `globals.css` defines `--font-display` (Michroma, scoped via `.font-display`/`.text-display`/`.text-eyebrow`) paired with `--font-body` (Inter) for body copy, a modular type scale (`--size-sm/base/md/lg/xl`), and a `.prose` 60ch measure utility
- Motion: Framer Motion is the primary motion system (entrances, hover, hero parallax) — hover states across cards use explicit Premium-tier timing (350ms, cubic-bezier(0.4,0,0.2,1)); GSAP ScrollTrigger stays scoped to `ash-text-section.tsx`'s pin/dissolve effect only — do not introduce a third animation system

**Theme System** (COMPLETE) — `src/context/theme-context.tsx`
- Dark / Warm / Bright themes + motion and mouse-trail accessibility toggles

**Projects & Prices Page** (COMPLETE) — cards redesigned to match Home page's floating Cards section style (glass cards, idle rotation, hover glow, scroll-reveal stagger), replacing the old horizontal drag-slider

**Admin Login/Auth** (COMPLETE) — `src/app/admin/login/page.tsx` (3-factor login: Username=Admin, Password=App@dmin0123, Code=2085; Back to Home link). `AdminCredentials` interface (`admin-auth.ts`) includes a `codeHash` field hashed with the same scrypt "salt:hash" scheme as the password. The login API (`api/admin/login/route.ts`) validates all three factors and returns a single generic 401 for any credential failure — it never reveals which factor was wrong. Old credential files without `codeHash` get the default code seeded automatically on next load.

**Admin Dashboard** (`src/components/admin/`)
- `admin-dashboard.tsx` - Main admin dashboard component (dark theme, Tailwind CSS; Log Out button). Sidebar redesigned into three groups: Pages (About, Projects & Prices), Homepage Sections (nested under Home — Ash Text, Cards), System (Email SMTP, Social Media, Storage), each with icons and descriptions
- `smtp-settings-panel.tsx` - SMTP email configuration panel (working)
- `storage-panel.tsx` - Storage backend status (fs vs Google Sheets/Drive), service-account email, per-document reachability, "Test connection", editable Sheet/Drive-folder link fields
- `home-text-manager.tsx`, `cards-manager.tsx`, `about-manager.tsx`, `projects-manager.tsx`, `social-media-panel.tsx`

**API Routes** (`src/app/api/`)
- `admin/smtp-config/route.ts` - SMTP configuration management (GET/POST)
  - Persists via the document store (`src/lib/store.ts`) — `.env.smtp.json` on the `fs` backend, an "SMTP" Sheets tab on the `sheets` backend
  - Validates required fields
  - Returns configuration data
- `admin/storage-status/route.ts` - reports active store backend, service-account email, per-document reachability, and a "Test connection" action for the admin Storage panel
- `media/[fileId]/route.ts` - serves images uploaded to Google Drive when the `sheets`/Drive backend is active, keeping the Drive folder itself private; authenticates with the OAuth token (not the service account), since OAuth-uploaded files are owned by the connected account
- `media/local/[...path]/route.ts` - serves locally-uploaded images from the non-public `uploads/` directory, reading from disk on every request (fixes the `public/uploads/` no-restart 404 bug)
- `admin/google-oauth/start/route.ts`, `admin/google-oauth/callback/route.ts` - "Connect Google Drive" OAuth flow (`src/lib/google-oauth.ts`); refresh token persisted via the document store's `google-oauth` document type
- Every admin POST route (cards, projects, home-text, about-content, smtp-config, social-config, social-post, and the three upload routes) enforces `requireAdmin()` (`src/lib/admin-auth.ts`); the matching GET routes stay unauthenticated on purpose since the public landing page reads content through them

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

**Last Updated**: August 16, 2026 — Save Point "ED11" (cube-reveal cap, cards redesign, scroll pacing rebuild, admin review pass)

### ED11 landmarks (cube-reveal cap, cards redesign, scroll pacing rebuild)
- `cube-reveal.tsx`'s reveal box height is `min(calc(100vw / aspect - trim), 320px)` — `MAX_VISIBLE_HEIGHT_PX = 320` caps visible height on wide viewports while the inner grid still keeps the image's full uncropped aspect ratio; only the top-clip amount under the mask gradient changes, never distortion. Don't remove the cap thinking it's redundant with the trim — it's what actually satisfies "shorter", the trim alone doesn't at full page width.
- `cards-section.tsx` cards are 100vw split 30% text / 70% image (was fixed pixel widths) — content is header + bullets, not flat paragraphs: first row per CardId group (lowest `cardImgNumber`) is `<h2>` (24px), rest are `<li>` (18px). `cards-manager.tsx` labels match ("Header" / "Bullet Point N"). Keep admin labels and rendered structure in sync if either changes.
- `cards-section.tsx` scroll is phase-based per card (`cardRefs`/`cardOffsets` via `offsetLeft`), not one linear interpolation — each card gets ~100vh (60% pause, 40% travel), plus a `HOLD_CARD_UNITS = 2` hold after the last card before release. The old hardcoded `CARD_COUNT = 7` is gone; wrapper height derives from `cards.length`. Don't reintroduce a fixed card-count constant.

### ED10 landmarks (admin unmount data-loss fix, uniform card font size)
- **All admin dashboard sections must stay mounted** — `admin-dashboard.tsx` toggles the active section's visibility with a `hidden` CSS class, not conditional rendering (`{activeSection === "x" && <X/>}`). Conditional rendering unmounts the inactive manager component, which throws away any unsaved local React state; the earlier "Cards content lost when navigating" report was this, not a persistence bug — remounting on tab-back re-fetches from the server and looks exactly like data loss. Don't reintroduce conditional mounting for any of the 7 admin sections.
- `cards-section.tsx` (Home Portfolio) and `sliding-cards.tsx` (Projects page) card text is a uniform 16px — was 14px/13px, changed per direct user request. Keep font sizing consistent between the two if either changes again.

### ED09 landmarks (imageUrl data-loss fix, Cards auto-ID)
- **`imageUrl` must exist in all four places or it silently vanishes on save**: `src/lib/sheet-schema.ts`'s Cards/Projects tab specs, both API routes' (`cards/route.ts`, `projects/route.ts`) interfaces/validation, and both admin managers' (`cards-manager.tsx`, `projects-manager.tsx`) POST payloads. The ED08 relational migration dropped it from all four at once — displayed fine within the admin's own session (in-memory state) but never persisted, a genuine data-loss bug, not a display bug. Any future field added to Cards/Projects needs the same four-place check.
- Cold-restart is the only real persistence test — a page reload can pass on stale in-memory cache even when a save is silently failing. Verify with: save → kill the entire dev server process → restart → read. This is how the ED09 imageUrl bug was actually caught and actually confirmed fixed.
- `cards-manager.tsx` no longer accepts a manually-typed ID or CardId — IDs are always auto-assigned ("+ Add Card" = next CardId, "+ Add Content Line" = next image number within a card group). Do not reintroduce a free-text ID field; this was a direct user requirement.
- Home Portfolio image panel (`cards-section.tsx`) uses `width:70%, height:70%` + `object-contain` — both dimensions are capped to the same fixed box so portrait/landscape uploads read at a consistent size. Don't go back to `height:auto`, which reintroduces per-image size variance driven by upload aspect ratio.
- Live-deployment-only "resetting" report is suspected (not confirmed) to be a missing Render env var causing silent fallback to the ephemeral `fs` backend — check the admin Storage panel / Render Environment tab first before assuming a code bug, since local persistence was independently proven solid this same save point.

### ED08 landmarks (relational Cards/Projects schema, indexed image naming)
- **BREAKING Sheets schema change — clear/recreate old tabs before testing on the `sheets` backend.** Cards tab: {id,title,description,imageUrl} → {id, cardId, cardContent, cardImgNumber}; multiple rows can share a `cardId`, which groups them into one Home Portfolio card. Projects tab: {id,title,briefInfo,approxPrice,imageUrl,order} → {id, cardId, details, cardLogoNumber, minDevCost}; `cardId` references a Cards group. `store.ts`'s `parseTab` reads by column **position**, not by matching header text — an old-header tab will silently misalign into the new fields rather than erroring. Any pre-existing "Cards" or "Projects" tab must be cleared/recreated.
- Image slot naming replaces timestamp naming for Cards/Projects uploads: `saveIndexedUpload()` in `src/lib/media.ts` writes `CardImg01.ext`/`CardImg02.ext` (Cards, per cardId) and `Logo01.ext`/`Logo02.ext` (Projects, per cardId). Re-uploading the same cardId+index slot **overwrites** the existing file — this is intentional stable-slot identity, not append-only history. The old timestamp-based `saveUpload()` still exists but is scoped to about-content uploads only; don't reuse it for cards/projects.
- Projects count is no longer fixed at 7 — the hardcoded validation (`api/admin/projects/route.ts`) and matching 7-slot admin UI gate (`projects-manager.tsx`) were both removed. Any count >= 0 is valid now; don't reintroduce the 7-item assumption elsewhere.
- `src/components/common/loading-overlay.tsx` is self-contained inside `CardsSection` (`cards-section.tsx`) — it's `position: fixed`, so it needs no wiring in `page.tsx`. Only appears if the cards fetch exceeds 2s.
- `hero-sphere.tsx`'s entrance fade is now two nested `motion.div`s: an outer one owns the new 4s `initial/animate` entrance fade, an inner one (unchanged) still owns the scroll-driven `sphereOpacity` exit fade via `style`. Don't collapse them into one div — that would make the two fades fight over a single `opacity` prop instead of composing.

### ED07 landmarks (uploads, contact form, Google Drive OAuth)
- **Service accounts cannot upload to a personal (non-Workspace) Google Drive — this is a Google platform restriction, not a bug in this codebase.** It fails with a 403 "Service Accounts do not have storage quota" and is not fixable by any code change, folder-sharing setting, or permission tweak. Confirmed against the live API. Google's own documented fix is OAuth as the real account owner, which is what `src/lib/google-oauth.ts` implements. Do not attempt to "fix" this by touching Drive folder sharing/permissions again — it has already been tried and ruled out.
- Sheets access uses the service account exclusively; Drive uploads/read-back use the OAuth connection exclusively. Don't merge these — a file uploaded via OAuth is owned by the connected account and a service-account request for it will 404.
- **Always verify `.env.local` is listed in `.gitignore` before running `git add` in this project.** It was found unprotected (holding the service-account private key and OAuth client secret) — never staged/committed, but the gap existed silently. Treat this as a standing pre-flight check, not a one-time fix.
- Local uploads are served via `/api/media/local/[...path]` (reads `uploads/` from disk per-request), not `public/uploads/**`. `next start` snapshots the `public/` directory listing once at boot, so any file uploaded to `public/uploads/` while the server is already running 404s until the process restarts — on Render that means until the next deploy. Don't move uploads back under `public/`.
- The "Connect Google Drive" step in the admin Storage panel is a one-time manual action a human must perform after each fresh deploy target (Google's consent screen can't be automated). The refresh token it produces then persists in the document store and renews itself indefinitely — don't assume it needs to be re-run on every deploy.
- Known/accepted, not a bug: the Storage panel's "Connected as [email]" can render blank — the OAuth scope is deliberately minimal (`drive.file` only) and doesn't include profile-email read access. Do not add scope just to populate that field.

### ED06 landmarks (SEO/GEO/AEO + performance)
- **Per-route metadata pattern**: a server-component page (e.g. `projects/page.tsx`) exports `metadata` directly. A `"use client"` page (e.g. `about/page.tsx`) cannot export `metadata` — Next.js's fix is a sibling `layout.tsx` in the same route folder that holds the `metadata` export instead (see `Deployment/app/src/app/about/layout.tsx`). Without one of these two, a page silently inherits the root layout's title/description via the metadata template — no error, no warning, just wrong `<title>`/OG tags and nothing generative-engine-quotable on that page. When adding a new page, check which pattern applies before assuming metadata is handled.
- **JSON-LD in root `layout.tsx`**: three schemas now coexist — `Person` (Mike Alemie, pre-existing), `Organization` (Pristinenoire LLC), `WebSite`. Keep all three when editing; they answer different query shapes (person-scoped vs company-scoped vs site-scoped) for GEO/AEO purposes.
- **Favicon**: `icons: { icon: "/images/pristinenoire-logo.png" }` in root `layout.tsx` metadata — there was none before ED06, which produced a 404 on every page load (caught by Lighthouse's best-practices audit, not by manual testing).
- **Heading order matters for Lighthouse a11y and is easy to silently violate**: every page needs exactly one `<h1>` and no level-skip before the first `<h2>`. Card/tile titles (`cards-section.tsx`, `sliding-cards.tsx`, `flashcards.tsx`) must sit under a real `<h2>` on that page, not jump straight to `<h3>`. `about-headline.tsx`'s visible headline is an `<h2>` (the page's real `<h1>` is visually hidden elsewhere) — don't "fix" it back to `<h1>`, that recreates a duplicate-`<h1>` violation.
- **Build/server-mismatch pitfall (Windows dev workflow)**: rebuilding with `rm -rf .next && npm run build` while an OLD `npm run start` process from a previous test is still bound to the port produces silently wrong results — the stale server keeps serving HTML referencing the OLD build's hashed chunk filenames, which no longer exist in the freshly-rebuilt `.next/static/chunks/`. This causes a real `ChunkLoadError` and a full client-side crash to Next's `html#__next_error__` fallback, which strips ALL metadata/title/lang/the main landmark — tanking every Lighthouse category at once and looking like a real regression when it's just a stale process. Diagnose by comparing the chunk hash actually referenced in `curl`'d HTML against what's actually on disk in `.next/static/chunks/`; if they don't match, kill all node processes and restart the server fresh before trusting any test result (Lighthouse or otherwise).
- Lighthouse itself isn't wired into CI — it was run manually (`npx lighthouse` against a real `npm run build && npm run start`, not `next dev`) for this one-time pass. No config file, no gate exists yet.
- Homepage Performance is 50/100 (hero Three.js sphere + canvas ash-text effect blocking the main thread ~6s) — deliberately NOT fixed this pass, tracked as a known, reproducible, still-open issue. `/about` and `/projects` (no 3D/canvas) are 98-99/100, confirming it's isolated to the homepage hero, not systemic.

### ED05 landmarks (persistence + admin security)
- Persistence is no longer flat-JSON-only. `src/lib/store.ts` is a document-store abstraction with a `fs` backend (unchanged `.env.*.json` behaviour, default) and a `sheets` backend (Google Sheets, auto-selected once Google env vars/admin overrides are set). **Read/write content through the store, not the filesystem directly** — new admin-editable fields should be added to `src/lib/sheet-schema.ts`'s per-tab column mapping as well as the fs shape, or they'll silently work locally and vanish on the Sheets backend.
- `Development/Implementation/MAWebsiteDB.sql` (T-SQL/SQL Server) is **superseded**, not implemented — Render doesn't offer SQL Server. Don't resume that migration; the Sheets/Drive store is the actual persistence solution now.
- Every admin POST route must call `requireAdmin()` (`src/lib/admin-auth.ts`) — this was missing site-wide until ED05 and was a live vulnerability (unauthenticated writes to SMTP password / social OAuth tokens included). When adding a new admin POST route, copy the auth check from an existing one (e.g. `api/admin/cards/route.ts`) — don't skip it.
- Admin sessions are intentionally NOT in the document store — they're an in-memory `Map` on `globalThis` (`src/lib/admin-auth.ts`). Do not migrate sessions into Sheets; that would add a network round-trip + quota cost to every protected page render. A redeploy/restart forcing re-login is expected behavior, not a bug.
- `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_SHEET_ID` / `GOOGLE_DRIVE_FOLDER_ID` are the only Google-related secrets; they live in `Deployment/render.yaml` as `sync: false` and are never committed. A live override of the sheet/folder IDs (not the key) can be set from the admin Storage panel, stored in gitignored `.env.google-links.json`.
- Live Sheets/Drive writes are **unverified** — the service-account key hasn't been provisioned yet. Don't assume the `sheets` backend has been exercised end-to-end; treat it as built-but-dormant until confirmed.
- Ash-text admin controls (`fontSize`/`textColor`/`letterSpacing`) still aren't wired to the rendered effect, and an 8-item visual punch list is still open — see `Development/Implementation/Roadmap.md` ED05 entry for the itemized list. Do not mark these done.

### ED04 landmarks (landing page + admin)
- **CubeReveal API change (important, supersedes ED03)**: `cube-reveal.tsx` is now a `forwardRef` component exposing `setProgress(p: number)` via `useImperativeHandle` — it is driven by a scroll-derived progress value computed in `ash-text-section.tsx`'s RAF loop, **not** a time-based CSS-transition-delay `active` boolean. Every cube's opacity/transform/brightness-wave is a direct function of that progress number, so the section's scroll position and the reveal's progress are the same number by construction — a fast scroll can no longer outrun the animation. If you see references to an `active` prop on `CubeReveal` anywhere, that's stale.
- **Admin duplicate-route auth-bypass class of bug**: a Next.js route GROUP (parenthesized folder, e.g. `(protected)`) does not change the URL. Two files can resolve to the same path — one guarded, one not — and the unguarded one can silently shadow the guarded one with zero indication in routing output. This actually happened: `app/admin/page.tsx` (no auth check) and `app/admin/(protected)/page.tsx` (guarded via the route group's layout) both mapped to `/admin`; the unguarded file won, giving unauthenticated admin access. Fixed by deleting the unguarded duplicate. **Whenever adding or reviewing a protected route, verify only ONE file resolves to that URL** — check sibling route groups, not just the literal folder.
- New on-disk config file: `.env.visitor-count.json`, written by `src/app/api/visitor-count/route.ts` (`GET` read-only, `POST { visitorId }` increments once per unique id in `seenIds`) — same pattern as `.env.smtp.json` and the other `.env.*.json` admin config stores. Client id lives in `localStorage` key `ma-visitor-id`.
- Admin logout must use a **hard** navigation (`window.location.replace("/")`), not `router.push`/`router.replace` — a soft App Router navigation can leave the client-side cache stale enough that the `(protected)` layout's server auth check doesn't necessarily re-run, letting the dashboard remain visible after logout. See `admin-dashboard.tsx`.
- `main` must stay `overflow-x-clip`, never `overflow-x-hidden`, on **every** page with a pinned/sticky section — `hidden` promotes it to a scroll container and silently breaks `position: sticky`. Applies to the landing page and `projects/page.tsx` (both fixed).
- Pinned scroll sections: `cards-section.tsx` (sequential named-breakpoint choreography — background fade, word pop/hold/fade, card fade-in, horizontal travel — full section height), `ash-text-section.tsx` (8 manifesto sentences, scroll-scrubbed particle assembly, ash-fall dissolution, then the progress-driven `CubeReveal` Mehrdad.png reveal — all inside the same pinned viewport, driven imperatively via RAF, not React state), and `sliding-cards.tsx` on `/projects` (same rail mechanism, bidirectional by construction since `x` tracks `scrollYProgress` directly). All use a tall wrapper + `sticky top-0 h-screen` inner.
- Ash section's real content source is `.env.home-text.json` via `/api/admin/home-text` (falls back to `DEFAULT_SENTENCES` in `ash-text-section.tsx` / `DEFAULT_CONFIG` in the API route) — if sentences look wrong or short, check the JSON file on disk first, not just the component code.
- Global overlays live in `layout.tsx`: `TargetCursor` (replaces the system cursor; hides it via `cursor: none` under a `hover:hover` media query) and `HeroMouseTrail` (top 160px band only, respects `useTheme().mouseTrailDisabled`).
- `neon-sphere.tsx` is an original GLSL shader — do not swap it for a copied third-party sphere. Texture-mapped from `/images/sphere-ref.png` (equirectangular UV); pole artifact fixed with a **dual-mapping cross-fade**: a second equirectangular projection with its poles on the X axis is cross-faded in at `abs(p.y) > ~0.55` (`poleBlend = smoothstep(0.55, 0.88, abs(p.y))`), so at any visible point on the ball at least one mapping samples cleanly — the synthetic cap and `capDetail` octave are gone. **Do not reintroduce a cap-based pole fix**: it paints over degenerate UV samples rather than replacing them, which always produces a visible smear or soft blob when the pole rotates into view, regardless of how the blend is shaped. Use `NormalBlending`, not additive: additive pushes the rim/filament/specular terms past 1.0 and clips the ball to flat white. Specular is normal-based (`lightDir`/`ndl`/`pow(ndl,110.0)`), tracking the pointer — do not revert to a screen-space falloff, which leaves a fixed hazy bloom at the pointer's default `(0,0)`. Fade-in is owned solely by the wrapper's CSS `opacity` transition — do not reintroduce a shader-side `uFade`.
- `Toggle` (`common/toggle.tsx`) must keep `type="button"` — without it, any toggle inside `<form>` (e.g. contact form's callback toggle) defaults to `type="submit"` and fires validation on click.
- Windows dev server: `.next` manifest files (`app-paths-manifest.json`, `webpack-runtime.js`, `page.js`, etc.) intermittently throw `UNKNOWN`/`errno -4094` on open. Not an orphaned-process issue (checked). Root cause still unidentified; recurred again this session. Fix each time: stop the server, delete `.next`, restart.
- `Development/Implementation/MAWebsiteDB.sql` is a full MS SQL Server DDL schema for the eventual migration target of the JSON-file persistence layer — **it is DDL only, nothing in the app reads/writes it yet**. Do not assume any code path talks to a real database.
**Project Status**: V0.01 α (Alpha)
