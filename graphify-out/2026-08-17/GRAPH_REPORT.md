# Graph Report - Mike Alemie Website  (2026-08-17)

## Corpus Check
- 84 files · ~668,485 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 570 nodes · 938 edges · 45 communities (42 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 1% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f8529db1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Google Sheets Content API
- Admin Content Managers
- Admin Dashboard UI
- Frontend Build Dependencies
- Admin Auth Rate Limiting
- TypeScript Compiler Config
- Runtime NPM Dependencies
- SEO Metadata + Cursor FX
- Theme + Sphere Visuals
- Ash Text Particle Animation
- Google OAuth Flow
- Contact Form + SMTP
- Roadmap Landmark Notes
- Navigation + Projects Nav
- Neon Star Scroll FX
- Social Media Posting API
- Governance & Landmark Index
- About Page Content
- Footer + Hero Layout
- SysArch Governance Model
- Portfolio Cards Section
- Deployment Env & Render Config
- Site Story Pages & Credentials
- Scroll Text Wave Animation
- Google Drive/Sheets Persistence
- Design Style Requirements
- Brand & Portrait Images
- Robot/Cyborg Hero Images
- Visitor Counter Store
- Landing Page Components
- storage-panel.tsx
- Hero Portrait Images Set
- PristineNoire Logo Assets
- Sphere Reference Images
- about/layout.tsx
- next.config.js
- next-env.d.ts
- home-text-manager.tsx
- projects-manager.tsx
- cards-manager.tsx

## God Nodes (most connected - your core abstractions)
1. `requireAdmin()` - 32 edges
2. `writeDoc()` - 26 edges
3. `readDoc()` - 19 edges
4. `useTheme()` - 17 edges
5. `compilerOptions` - 16 edges
6. `buildStatus()` - 14 edges
7. `saveIndexedUpload()` - 10 edges
8. `getSheetId()` - 9 edges
9. `POST()` - 8 edges
10. `isOAuthClientConfigured()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Cinematic Design Style` --references--> `Landing Home Page`  [INFERRED]
  Instructions/Gen UI/UIUX.md → Development/CLAUDE.md
- `Landing Home Page (Story)` --references--> `Landing Home Page`  [INFERRED]
  Instructions/Epic/AppStory.md → Development/CLAUDE.md
- `Document Store (src/lib/store.ts)` --shares_data_with--> `Google Sheets Runtime Content Storage`  [INFERRED]
  Development/CLAUDE.md → Deployment/DEPLOY-README.md
- `src/lib/google-oauth.ts` --shares_data_with--> `Google Drive OAuth Upload Credential`  [INFERRED]
  Development/CLAUDE.md → Deployment/DEPLOY-README.md
- `UIUX Demo Login Credentials` --references--> `Default Admin Credentials`  [INFERRED]
  Instructions/Gen UI/UIUX.md → Deployment/DEPLOY-README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Governance Documents** — development_claude_md, instructions_gen_architecture_sysarch, instructions_gen_ui_uiux, instructions_epic_appstory, development_implementation_roadmap [EXTRACTED 1.00]
- **Google Sheets/Drive Persistence Backend** — development_claude_md_document_store, development_claude_md_sheet_schema, development_claude_md_google_oauth_lib, deployment_deploy_readme_google_sheets_storage, deployment_deploy_readme_google_drive_oauth, deployment_render_yaml_google_env_vars [INFERRED 0.85]
- **Roadmap Save Point Sequence** — development_implementation_roadmap_save_point_ed01, development_implementation_roadmap_save_point_ed02, development_implementation_roadmap_save_point_ed03, development_implementation_roadmap_save_point_ed04, development_implementation_roadmap_save_point_ed04_final, development_implementation_roadmap_save_point_ed05, development_implementation_roadmap_save_point_ed06, development_implementation_roadmap_save_point_ed07, development_implementation_roadmap_save_point_ed08, development_implementation_roadmap_save_point_ed09, development_implementation_roadmap_save_point_ed10, development_implementation_roadmap_save_point_ed11 [EXTRACTED 1.00]

## Communities (45 total, 3 thin omitted)

### Community 0 - "Google Sheets Content API"
Cohesion: 0.07
Nodes (52): buildStatus(), GET(), POST(), getGoogleClient(), getServiceAccountEmail(), GoogleConfigError, googleFetch(), hasServiceAccount() (+44 more)

### Community 1 - "Admin Content Managers"
Cohesion: 0.05
Nodes (53): AboutContent, DEFAULT_CONTENT, Flashcard, GET(), POST(), CardItem, CardsConfig, DEFAULT_CARDS (+45 more)

### Community 2 - "Admin Dashboard UI"
Cohesion: 0.16
Nodes (11): SMTPConfig, SMTPSettingsPanel(), DEFAULT_CONFIG, FacebookConfig, InstagramConfig, Platform, PostResult, SocialConfig (+3 more)

### Community 3 - "Frontend Build Dependencies"
Cohesion: 0.07
Nodes (29): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/nodemailer, @types/react (+21 more)

### Community 4 - "Admin Auth Rate Limiting"
Cohesion: 0.13
Nodes (23): AdminProtectedLayout(), NOTE: This is implemented as a layout guard rather than Next.js Edge, clearFailedAttempts(), failedAttempts, getClientIp(), isLockedOut(), POST(), RateLimitEntry (+15 more)

### Community 5 - "TypeScript Compiler Config"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 6 - "Runtime NPM Dependencies"
Cohesion: 0.09
Nodes (23): dependencies, framer-motion, google-auth-library, gsap, motion, motion-v, next, nodemailer (+15 more)

### Community 7 - "SEO Metadata + Cursor FX"
Cohesion: 0.16
Nodes (13): metadata, ORGANIZATION_JSON_LD, PERSON_JSON_LD, WEBSITE_JSON_LD, getPointerZone(), PointerZone, Dot, TargetCursor() (+5 more)

### Community 8 - "Theme + Sphere Visuals"
Cohesion: 0.18
Nodes (11): FlashCard(), Flashcards(), NeonSphere(), SpherePalette, THEME_PALETTES, THEME_OPTIONS, ThemeControl(), ThemeContext (+3 more)

### Community 9 - "Ash Text Particle Animation"
Cohesion: 0.15
Nodes (13): ASH_COLORS, AshTextSection(), buildBlendTable(), buildParticles(), DEFAULT_SENTENCES, HomeTextConfig, parseHex(), Particle (+5 more)

### Community 10 - "Google OAuth Flow"
Cohesion: 0.13
Nodes (28): POST(), POST(), GET(), GET(), POST(), GET(), GET(), requireAdmin() (+20 more)

### Community 11 - "Contact Form + SMTP"
Cohesion: 0.18
Nodes (11): Attachment, ContactPayload, EMPTY_SMTP, POST(), SMTPConfig, ContactForm(), fileToBase64(), FormState (+3 more)

### Community 12 - "Roadmap Landmark Notes"
Cohesion: 0.19
Nodes (13): ED06 Landmarks (SEO/GEO/AEO), ED08 Landmarks (relational schema), ED11 Landmarks, Homepage Performance Issue (Lighthouse 50/100), Save Point Ed01, Save Point ED02, Save Point ED03, Save Point ED04-final (+5 more)

### Community 13 - "Navigation + Projects Nav"
Cohesion: 0.33
Nodes (5): groupProjects(), PLACEHOLDER_PROJECTS, ProjectCardData, ProjectRow, SlidingCards()

### Community 14 - "Neon Star Scroll FX"
Cohesion: 0.19
Nodes (10): drawSparkle(), DRIFT_DIRECTIONS, NEON_STAR_COLORS, NeonStar, rand(), TopStarBand(), FlashTexts(), FONTS (+2 more)

### Community 15 - "Social Media Posting API"
Cohesion: 0.18
Nodes (5): AdminDashboard(), LeafItem, NAV_GROUPS, NavGroup, Section

### Community 16 - "Governance & Landmark Index"
Cohesion: 0.18
Nodes (10): Agent Efficiency Rules, Output Control Mode, Token Efficiency Skill, Admin Dashboard, ED04 Landmarks (auth-bypass fix), ED07 Landmarks (uploads, contact form, OAuth), requireAdmin() Auth Gate, Theme System (+2 more)

### Community 17 - "About Page Content"
Cohesion: 0.24
Nodes (7): AboutContent, DEFAULT_CONTENT, AboutBody(), AboutBodyProps, AboutHeadline(), AboutHeadlineProps, FlashcardItem

### Community 18 - "Footer + Hero Layout"
Cohesion: 0.15
Nodes (10): metadata, Breadcrumbs(), Crumb, Footer(), IMG_STYLE, HeroSection(), BRAND_LETTERS, FLUORESCENT_COLORS (+2 more)

### Community 19 - "SysArch Governance Model"
Cohesion: 0.18
Nodes (10): Governance Rules, Layered Architecture, Modular Agile Iterative (MAI), AI Development Approach (Mode 1/Mode 2), Claude Code Role (Mode 2), Default Application Layers, SysArch Governance Rules, MAI SDLC Model (+2 more)

### Community 20 - "Portfolio Cards Section"
Cohesion: 0.27
Nodes (8): LoadingOverlay(), CardItem, CardsSection(), groupCards(), HorizontalCard(), PLACEHOLDER_GROUPS, PortfolioCard, splitHeaderAndBullet()

### Community 21 - "Deployment Env & Render Config"
Cohesion: 0.24
Nodes (9): DEPLOY-README, Deployment/app, Environment Variables, MAWebsiteDB.sql (historical), uploads/ Runtime Directory, mike-alemie-website Render Service, ED05 Landmarks (persistence + admin security), MAWebsiteDB.sql Migration Target (+1 more)

### Community 22 - "Site Story Pages & Credentials"
Cohesion: 0.22
Nodes (8): Default Admin Credentials, Admin Login/Auth (3-factor), Mike Alemie Website Project, About Page (Story), Admin Page (Story), Pristinenoire LLC, Projects and Prices Page (Story), UIUX Demo Login Credentials

### Community 23 - "Scroll Text Wave Animation"
Cohesion: 0.33
Nodes (6): ContentSection(), DEFAULT_TIMINGS, HEADING_WORDS, rand(), WAVE_COLORS, WordTiming

### Community 24 - "Google Drive/Sheets Persistence"
Cohesion: 0.38
Nodes (7): Google Drive OAuth Upload Credential, Google Sheets Runtime Content Storage, Google Sheets/Drive Env Vars (sync:false), Document Store (src/lib/store.ts), src/lib/google-oauth.ts, /api/media/local/[...path] Route, sheet-schema.ts

### Community 25 - "Design Style Requirements"
Cohesion: 0.29
Nodes (6): Required ChatBot Spec, Cinematic Design Style, CSS Style Hierarchy, Design Model Options (Cinematic, Brutalist, etc.), General Typography Rules, Sample Fonts List

### Community 26 - "Brand & Portrait Images"
Cohesion: 0.33
Nodes (7): download.png - portrait of Mike Alemie with sci-fi HUD overlay and name caption, Mehrdad.png - portrait with sci-fi HUD targeting overlay, Pristinenoire Ecosystem.png - org chart of PristineNoire LLC subsidiaries, Pristinenoire LLC.png - brand logo on dark purple background, Pristinenoire_LLC.png_TRSP.jpeg - transparent-background version of PristineNoire logo, Prj01.png - SQLSentinel app sign-in page screenshot, QR Code.png - generic black and white QR code

### Community 27 - "Robot/Cyborg Hero Images"
Cohesion: 0.33
Nodes (6): Cyborg profile (left variant, ash tone), Cyborg profile (right variant, ash tone), Home page hero figure (halftone android), Mehrdad portrait with HUD overlay, White/orange robot head (left variant), White/orange robot head (right variant)

### Community 28 - "Visitor Counter Store"
Cohesion: 0.33
Nodes (6): AboutContent, AboutManager(), DEFAULT_CONTENT, Flashcard, FONT_FAMILIES, makeId()

### Community 29 - "Landing Page Components"
Cohesion: 0.40
Nodes (6): ash-text-section.tsx GSAP Scroll-Pin Animation, cards-section.tsx, cube-reveal.tsx CubeReveal Component, Landing Home Page, neon-sphere.tsx GLSL Shader Sphere, Landing Home Page (Story)

### Community 30 - "storage-panel.tsx"
Cohesion: 0.40
Nodes (3): DocStatus, StoragePanel(), StorageStatus

### Community 31 - "Hero Portrait Images Set"
Cohesion: 0.50
Nodes (5): Home.jpeg - cyborg female profile hero image, Left.jpeg - half-human half-robot male head profile (left variant), Right.jpeg - half-human half-robot male head profile (right variant), Robot right02 (1).png - stock android head profile render, Sphere.png - glowing blue and orange energy sphere/planet

### Community 32 - "PristineNoire Logo Assets"
Cohesion: 0.67
Nodes (3): PristineNoire LLC logo (stacked layout), PristineNoire logo (wide layout), QR code image

### Community 33 - "Sphere Reference Images"
Cohesion: 1.00
Nodes (3): Blue/orange energy sphere (png), Site screenshot reference: sphere hero section, Blue/orange energy sphere (warm variant, jpg)

### Community 42 - "home-text-manager.tsx"
Cohesion: 0.33
Nodes (6): DEFAULT_CONFIG, FONT_OPTIONS, generateId(), HomeTextConfig, HomeTextManager(), HomeTextSentence

### Community 43 - "projects-manager.tsx"
Cohesion: 0.43
Nodes (6): CardOption, generateId(), nextContentIndex(), nextProjectId(), ProjectRow, ProjectsManager()

### Community 44 - "cards-manager.tsx"
Cohesion: 0.53
Nodes (5): CardItem, CardsManager(), generateId(), nextCardId(), nextImgNumber()

## Ambiguous Edges - Review These
- `Token Efficiency Skill` → `Development/CLAUDE.md`  [AMBIGUOUS]
  .claude/Skills/Token-Efficiency/Token-Efficiency.md · relation: conceptually_related_to
- `PristineNoire LLC logo (stacked layout)` → `QR code image`  [AMBIGUOUS]
  Deployment/app/public/images/qr-code.png · relation: conceptually_related_to
- `Home.jpeg - cyborg female profile hero image` → `Sphere.png - glowing blue and orange energy sphere/planet`  [AMBIGUOUS]
  Sprints/Website/Sphere.png · relation: conceptually_related_to
- `Mehrdad.png - portrait with sci-fi HUD targeting overlay` → `Pristinenoire LLC.png - brand logo on dark purple background`  [AMBIGUOUS]
  Sprints/Website/Mehrdad.png · relation: conceptually_related_to
- `Mehrdad.png - portrait with sci-fi HUD targeting overlay` → `Prj01.png - SQLSentinel app sign-in page screenshot`  [AMBIGUOUS]
  Sprints/Website/Prj01.png · relation: conceptually_related_to
- `Pristinenoire LLC.png - brand logo on dark purple background` → `QR Code.png - generic black and white QR code`  [AMBIGUOUS]
  Sprints/Website/QR Code.png · relation: conceptually_related_to

## Knowledge Gaps
- **203 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `node` (+198 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Token Efficiency Skill` and `Development/CLAUDE.md`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `PristineNoire LLC logo (stacked layout)` and `QR code image`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Home.jpeg - cyborg female profile hero image` and `Sphere.png - glowing blue and orange energy sphere/planet`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Mehrdad.png - portrait with sci-fi HUD targeting overlay` and `Pristinenoire LLC.png - brand logo on dark purple background`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Mehrdad.png - portrait with sci-fi HUD targeting overlay` and `Prj01.png - SQLSentinel app sign-in page screenshot`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Pristinenoire LLC.png - brand logo on dark purple background` and `QR Code.png - generic black and white QR code`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `readDoc()` connect `Admin Content Managers` to `Google Sheets Content API`, `Google OAuth Flow`, `Contact Form + SMTP`, `Admin Auth Rate Limiting`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._