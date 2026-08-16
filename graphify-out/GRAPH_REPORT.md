# Graph Report - Mike Alemie Website  (2026-08-16)

## Corpus Check
- 84 files · ~665,181 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 541 nodes · 870 edges · 42 communities (38 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30e3e83e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- writeDoc
- about/page.tsx
- ash-text-section.tsx
- requireAdmin
- devDependencies
- admin-auth.ts
- compilerOptions
- store.ts
- admin-dashboard.tsx
- storage-status/route.ts
- dependencies
- social-media-panel.tsx
- social-post/route.ts
- app/layout.tsx
- CLAUDE.md
- useTheme
- about-manager.tsx
- home-text-manager.tsx
- contact-form.tsx
- Completed
- projects-manager.tsx
- about/layout.tsx
- app/page.tsx
- next.config.js
- next-env.d.ts
- hero-sphere.tsx
- Token-Efficiency.md
- Deploying Mike Alemie Website — Internet Host Provider
- cards-section.tsx
- content-section.tsx
- cards-manager.tsx
- storage-panel.tsx
- footer.tsx
- theme-context.tsx

## God Nodes (most connected - your core abstractions)
1. `requireAdmin()` - 32 edges
2. `writeDoc()` - 26 edges
3. `readDoc()` - 19 edges
4. `useTheme()` - 17 edges
5. `compilerOptions` - 16 edges
6. `buildStatus()` - 14 edges
7. `saveIndexedUpload()` - 10 edges
8. `Completed` - 10 edges
9. `getSheetId()` - 9 edges
10. `Deploying Mike Alemie Website — Internet Host Provider` - 9 edges

## Surprising Connections (you probably didn't know these)
- `FlashCard()` --calls--> `useTheme()`  [EXTRACTED]
  Deployment/app/src/components/about/flashcards.tsx → Deployment/app/src/context/theme-context.tsx
- `GET()` --calls--> `readDoc()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/about-content/route.ts → Deployment/app/src/lib/store.ts
- `POST()` --calls--> `requireAdmin()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/about-content/route.ts → Deployment/app/src/lib/admin-auth.ts
- `GET()` --calls--> `readDoc()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/cards/route.ts → Deployment/app/src/lib/store.ts
- `POST()` --calls--> `requireAdmin()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/cards/route.ts → Deployment/app/src/lib/admin-auth.ts

## Import Cycles
- None detected.

## Communities (42 total, 4 thin omitted)

### Community 0 - "writeDoc"
Cohesion: 0.06
Nodes (42): AboutContent, DEFAULT_CONTENT, Flashcard, GET(), POST(), CardItem, CardsConfig, DEFAULT_CARDS (+34 more)

### Community 1 - "about/page.tsx"
Cohesion: 0.20
Nodes (9): AboutContent, DEFAULT_CONTENT, AboutBody(), AboutBodyProps, AboutHeadline(), AboutHeadlineProps, FlashCard(), FlashcardItem (+1 more)

### Community 2 - "ash-text-section.tsx"
Cohesion: 0.15
Nodes (13): ASH_COLORS, AshTextSection(), buildBlendTable(), buildParticles(), DEFAULT_SENTENCES, HomeTextConfig, parseHex(), Particle (+5 more)

### Community 3 - "requireAdmin"
Cohesion: 0.13
Nodes (28): POST(), POST(), GET(), GET(), POST(), GET(), GET(), requireAdmin() (+20 more)

### Community 4 - "devDependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/nodemailer, @types/react (+21 more)

### Community 5 - "admin-auth.ts"
Cohesion: 0.13
Nodes (23): AdminProtectedLayout(), NOTE: This is implemented as a layout guard rather than Next.js Edge, clearFailedAttempts(), failedAttempts, getClientIp(), isLockedOut(), POST(), RateLimitEntry (+15 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 7 - "store.ts"
Cohesion: 0.12
Nodes (26): googleFetch(), coerce(), Column, FieldType, getPath(), KeyValueSpec, setPath(), SHEET_SCHEMA (+18 more)

### Community 8 - "admin-dashboard.tsx"
Cohesion: 0.15
Nodes (7): AdminDashboard(), LeafItem, NAV_GROUPS, NavGroup, Section, SMTPConfig, SMTPSettingsPanel()

### Community 9 - "storage-status/route.ts"
Cohesion: 0.16
Nodes (26): buildStatus(), GET(), POST(), getGoogleClient(), getServiceAccountEmail(), GoogleConfigError, hasServiceAccount(), isGoogleConfigured() (+18 more)

### Community 10 - "dependencies"
Cohesion: 0.09
Nodes (23): dependencies, framer-motion, google-auth-library, gsap, motion, motion-v, next, nodemailer (+15 more)

### Community 11 - "social-media-panel.tsx"
Cohesion: 0.25
Nodes (7): DEFAULT_CONFIG, FacebookConfig, InstagramConfig, Platform, PostResult, SocialConfig, SocialMediaPanel()

### Community 12 - "social-post/route.ts"
Cohesion: 0.24
Nodes (11): appendToLog(), GET(), Platform, POST(), postToFacebook(), postToInstagram(), TODO: replace with real Instagram Graph API call (POST /{ig-user-id}/media then, TODO: replace with real Facebook Graph API call (POST /{page-id}/feed or /photos (+3 more)

### Community 13 - "app/layout.tsx"
Cohesion: 0.18
Nodes (12): metadata, ORGANIZATION_JSON_LD, PERSON_JSON_LD, WEBSITE_JSON_LD, getPointerZone(), PointerZone, Dot, TargetCursor() (+4 more)

### Community 14 - "CLAUDE.md"
Cohesion: 0.08
Nodes (24): Architecture & Design Principles, Asset & Sprint Organization, Before Making Changes, Current Implementation, Development Approach, Development Workflow, ED04 landmarks (landing page + admin), ED05 landmarks (persistence + admin security) (+16 more)

### Community 15 - "useTheme"
Cohesion: 0.22
Nodes (7): NeonSphere(), SpherePalette, THEME_PALETTES, PLACEHOLDER_PROJECTS, ProjectItem, SlidingCards(), useTheme()

### Community 16 - "about-manager.tsx"
Cohesion: 0.33
Nodes (6): AboutContent, AboutManager(), DEFAULT_CONTENT, Flashcard, FONT_FAMILIES, makeId()

### Community 17 - "home-text-manager.tsx"
Cohesion: 0.33
Nodes (6): DEFAULT_CONFIG, FONT_OPTIONS, generateId(), HomeTextConfig, HomeTextManager(), HomeTextSentence

### Community 18 - "contact-form.tsx"
Cohesion: 0.15
Nodes (13): Attachment, ContactPayload, EMPTY_SMTP, POST(), SMTPConfig, Toggle(), ToggleProps, ContactForm() (+5 more)

### Community 19 - "Completed"
Cohesion: 0.10
Nodes (20): Completed, In Progress, In Progress (carried into ED06), Known follow-ups from ED02 (carried forward), Known follow-ups from ED04, Known follow-ups from ED05, Known follow-ups from ED06, Known follow-ups from ED07 (+12 more)

### Community 20 - "projects-manager.tsx"
Cohesion: 0.50
Nodes (4): EMPTY_PROJECTS, generateId(), ProjectItem, ProjectsManager()

### Community 22 - "app/page.tsx"
Cohesion: 0.19
Nodes (9): metadata, Breadcrumbs(), Crumb, BRAND_LETTERS, FLUORESCENT_COLORS, NAV_LINKS, Navigation(), THEME_OPTIONS (+1 more)

### Community 30 - "hero-sphere.tsx"
Cohesion: 0.18
Nodes (11): drawSparkle(), DRIFT_DIRECTIONS, HeroSection(), NEON_STAR_COLORS, NeonStar, rand(), TopStarBand(), FlashTexts() (+3 more)

### Community 31 - "Token-Efficiency.md"
Cohesion: 0.15
Nodes (12): Agent and Subagent Rules, Agent Efficiency Rules, Claude Code Token Efficient Development Skill, Coding Mode, File Creation Policy, Objective, Output Control Mode, Output Restrictions (+4 more)

### Community 32 - "Deploying Mike Alemie Website — Internet Host Provider"
Cohesion: 0.15
Nodes (12): 1. Requirements on the host, 2. Files & folders, 2a. Deploying on Render specifically, 2b. "I deployed and my changes aren't saving" — check this first, 3. Build & run, 4. Environment variables, 4a-i. Google Drive uploads need a second, different credential, 4a. Runtime content storage — read before your first deploy (+4 more)

### Community 33 - "cards-section.tsx"
Cohesion: 0.28
Nodes (6): LoadingOverlay(), CardItem, CardsSection(), groupCards(), PLACEHOLDER_GROUPS, PortfolioCard

### Community 34 - "content-section.tsx"
Cohesion: 0.33
Nodes (6): ContentSection(), DEFAULT_TIMINGS, HEADING_WORDS, rand(), WAVE_COLORS, WordTiming

### Community 35 - "cards-manager.tsx"
Cohesion: 0.60
Nodes (4): CardItem, CardsManager(), generateId(), nextCardId()

### Community 36 - "storage-panel.tsx"
Cohesion: 0.40
Nodes (3): DocStatus, StoragePanel(), StorageStatus

### Community 38 - "theme-context.tsx"
Cohesion: 0.40
Nodes (4): ThemeContext, ThemeContextValue, ThemeName, ThemeProvider()

## Knowledge Gaps
- **228 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `node` (+223 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readDoc()` connect `writeDoc` to `requireAdmin`, `admin-auth.ts`, `store.ts`, `storage-status/route.ts`, `social-post/route.ts`, `contact-form.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `Breadcrumbs()` connect `app/page.tsx` to `admin-dashboard.tsx`, `about/page.tsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `writeDoc` be split into smaller, more focused modules?**
  _Cohesion score 0.06207482993197279 - nodes in this community are weakly interconnected._
- **Should `requireAdmin` be split into smaller, more focused modules?**
  _Cohesion score 0.12912912912912913 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._
- **Should `admin-auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1282051282051282 - nodes in this community are weakly interconnected._