# Graph Report - Mike Alemie Website  (2026-08-03)

## Corpus Check
- 55 files · ~87,768 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 383 edges · 28 communities (25 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f0097cf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- admin-dashboard.tsx
- admin-auth.ts
- compilerOptions
- dependencies
- CLAUDE.md
- devDependencies
- about/page.tsx
- social-post/route.ts
- contact-form.tsx
- social-config/route.ts
- about-content/route.ts
- cards/route.ts
- home-text/route.ts
- projects/route.ts
- about-content/upload/route.ts
- cards/upload/route.ts
- projects/upload/route.ts
- smtp-config/route.ts
- Roadmap
- next.config.js
- next-env.d.ts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 16 edges
2. `useTheme()` - 14 edges
3. `POST()` - 8 edges
4. `createSession()` - 7 edges
5. `destroySession()` - 6 edges
6. `scripts` - 5 edges
7. `ThemeControl()` - 5 edges
8. `isSessionValid()` - 5 edges
9. `validatePhoneNumber()` - 5 edges
10. `include` - 5 edges

## Surprising Connections (you probably didn't know these)
- `FlashCard()` --calls--> `useTheme()`  [EXTRACTED]
  Deployment/app/src/components/about/flashcards.tsx → Deployment/app/src/context/theme-context.tsx
- `AdminProtectedLayout()` --calls--> `isSessionValid()`  [EXTRACTED]
  Deployment/app/src/app/admin/(protected)/layout.tsx → Deployment/app/src/lib/admin-auth.ts
- `POST()` --calls--> `destroySession()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/logout/route.ts → Deployment/app/src/lib/admin-auth.ts
- `POST()` --calls--> `validatePhoneNumber()`  [EXTRACTED]
  Deployment/app/src/app/api/contact/route.ts → Deployment/app/src/lib/phone-validation.ts
- `FloatingCard()` --calls--> `useTheme()`  [EXTRACTED]
  Deployment/app/src/components/landing/cards-section.tsx → Deployment/app/src/context/theme-context.tsx

## Import Cycles
- None detected.

## Communities (28 total, 3 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.07
Nodes (28): metadata, AshParticle, AshTextSection(), AshTextSectionProps, buildParticlesFromText(), GREY_FLUORESCENT_HUES, HomeTextConfig, HomeTextSentence (+20 more)

### Community 1 - "admin-dashboard.tsx"
Cohesion: 0.06
Nodes (30): AboutContent, AboutManager(), DEFAULT_CONTENT, Flashcard, FONT_FAMILIES, makeId(), AdminDashboard(), NAV_ITEMS (+22 more)

### Community 2 - "admin-auth.ts"
Cohesion: 0.13
Nodes (25): AdminProtectedLayout(), NOTE: This is implemented as a layout guard rather than Next.js Edge, clearFailedAttempts(), failedAttempts, getClientIp(), isLockedOut(), POST(), RateLimitEntry (+17 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 4 - "dependencies"
Cohesion: 0.09
Nodes (21): dependencies, framer-motion, gsap, next, react, react-dom, three, name (+13 more)

### Community 5 - "CLAUDE.md"
Cohesion: 0.10
Nodes (19): Architecture & Design Principles, Asset & Sprint Organization, Before Making Changes, Current Implementation, Development Approach, Development Workflow, Existing Components & Features, File Naming Conventions (+11 more)

### Community 6 - "devDependencies"
Cohesion: 0.12
Nodes (17): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+9 more)

### Community 7 - "about/page.tsx"
Cohesion: 0.20
Nodes (9): AboutContent, DEFAULT_CONTENT, AboutBody(), AboutBodyProps, AboutHeadline(), AboutHeadlineProps, FlashCard(), FlashcardItem (+1 more)

### Community 8 - "social-post/route.ts"
Cohesion: 0.22
Nodes (12): appendToLog(), GET(), LOG_FILE, Platform, POST(), postToFacebook(), postToInstagram(), TODO: replace with real Instagram Graph API call (POST /{ig-user-id}/media then (+4 more)

### Community 9 - "contact-form.tsx"
Cohesion: 0.23
Nodes (8): ContactPayload, POST(), NOTE: actual SMTP dispatch reuses the existing SMTP config, ContactForm(), FormState, INITIAL_STATE, PhoneValidationResult, validatePhoneNumber()

### Community 10 - "social-config/route.ts"
Cohesion: 0.27
Nodes (9): CONFIG_FILE, DEFAULT_CONFIG, FacebookConfig, GET(), InstagramConfig, maskConfig(), maskToken(), POST() (+1 more)

### Community 11 - "about-content/route.ts"
Cohesion: 0.29
Nodes (4): AboutContent, CONFIG_FILE, DEFAULT_CONTENT, Flashcard

### Community 12 - "cards/route.ts"
Cohesion: 0.29
Nodes (4): CardItem, CardsConfig, CONFIG_FILE, DEFAULT_CARDS

### Community 13 - "home-text/route.ts"
Cohesion: 0.29
Nodes (4): CONFIG_FILE, DEFAULT_CONFIG, HomeTextConfig, HomeTextSentence

### Community 14 - "projects/route.ts"
Cohesion: 0.29
Nodes (4): CONFIG_FILE, DEFAULT_PROJECTS, ProjectItem, ProjectsConfig

### Community 15 - "about-content/upload/route.ts"
Cohesion: 0.50
Nodes (4): ALLOWED_TYPES, POST(), sanitizeFileName(), UPLOAD_DIR

### Community 16 - "cards/upload/route.ts"
Cohesion: 0.50
Nodes (4): ALLOWED_TYPES, POST(), sanitizeFileName(), UPLOAD_DIR

### Community 17 - "projects/upload/route.ts"
Cohesion: 0.50
Nodes (4): ALLOWED_TYPES, POST(), sanitizeFileName(), UPLOAD_DIR

### Community 19 - "Roadmap"
Cohesion: 0.40
Nodes (4): Completed, In Progress, Not Started, Roadmap

## Knowledge Gaps
- **143 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `dev` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `dependencies`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `app/page.tsx` to `about/page.tsx`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07342995169082125 - nodes in this community are weakly interconnected._
- **Should `admin-dashboard.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06477732793522267 - nodes in this community are weakly interconnected._
- **Should `admin-auth.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12807881773399016 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._