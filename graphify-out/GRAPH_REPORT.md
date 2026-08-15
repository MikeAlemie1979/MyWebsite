# Graph Report - .  (2026-08-15)

## Corpus Check
- 7 files · ~657,815 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 427 nodes · 693 edges · 30 communities (27 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24

## God Nodes (most connected - your core abstractions)
1. `requireAdmin()` - 28 edges
2. `writeDoc()` - 23 edges
3. `readDoc()` - 17 edges
4. `compilerOptions` - 16 edges
5. `useTheme()` - 13 edges
6. `buildStatus()` - 12 edges
7. `saveUpload()` - 12 edges
8. `googleFetch()` - 10 edges
9. `POST()` - 8 edges
10. `getSheetId()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `readDoc()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/about-content/route.ts → Deployment/app/src/lib/store.ts
- `POST()` --calls--> `requireAdmin()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/about-content/route.ts → Deployment/app/src/lib/admin-auth.ts
- `GET()` --calls--> `readDoc()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/cards/route.ts → Deployment/app/src/lib/store.ts
- `POST()` --calls--> `requireAdmin()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/cards/route.ts → Deployment/app/src/lib/admin-auth.ts
- `GET()` --calls--> `readDoc()`  [EXTRACTED]
  Deployment/app/src/app/api/admin/home-text/route.ts → Deployment/app/src/lib/store.ts

## Import Cycles
- None detected.

## Communities (30 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (42): AboutContent, DEFAULT_CONTENT, Flashcard, GET(), POST(), CardItem, CardsConfig, DEFAULT_CARDS (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (27): AboutContent, DEFAULT_CONTENT, AboutBody(), AboutBodyProps, AboutHeadline(), AboutHeadlineProps, FlashcardItem, Flashcards() (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (36): POST(), POST(), POST(), buildStatus(), GET(), POST(), GET(), requireAdmin() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (31): ASH_COLORS, AshTextSection(), buildBlendTable(), buildParticles(), DEFAULT_SENTENCES, HomeTextConfig, parseHex(), Particle (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (25): googleFetch(), coerce(), Column, FieldType, getPath(), KeyValueSpec, setPath(), SHEET_SCHEMA (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.07
Nodes (27): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, @types/node, @types/react, @types/react-dom (+19 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (23): AdminProtectedLayout(), NOTE: This is implemented as a layout guard rather than Next.js Edge, clearFailedAttempts(), failedAttempts, getClientIp(), isLockedOut(), POST(), RateLimitEntry (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.07
Nodes (26): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+18 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (19): dependencies, framer-motion, google-auth-library, gsap, motion, motion-v, next, react (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (5): AdminDashboard(), LeafItem, NAV_GROUPS, NavGroup, Section

### Community 10 - "Community 10"
Cohesion: 0.24
Nodes (11): appendToLog(), GET(), Platform, POST(), postToFacebook(), postToInstagram(), TODO: replace with real Instagram Graph API call (POST /{ig-user-id}/media then, TODO: replace with real Facebook Graph API call (POST /{page-id}/feed or /photos (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.23
Nodes (8): ContactPayload, POST(), NOTE: actual SMTP dispatch reuses the existing SMTP config, ContactForm(), FormState, INITIAL_STATE, PhoneValidationResult, validatePhoneNumber()

### Community 12 - "Community 12"
Cohesion: 0.27
Nodes (8): getPointerZone(), PointerZone, Dot, TargetCursor(), drawStar(), HeroMouseTrail(), Particle, TRAIL_COLORS

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (4): metadata, PLACEHOLDER_PROJECTS, ProjectItem, SlidingCards()

### Community 14 - "Community 14"
Cohesion: 0.25
Nodes (7): DEFAULT_CONFIG, FacebookConfig, InstagramConfig, Platform, PostResult, SocialConfig, SocialMediaPanel()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (6): AboutContent, AboutManager(), DEFAULT_CONTENT, Flashcard, FONT_FAMILIES, makeId()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (6): DEFAULT_CONFIG, FONT_OPTIONS, generateId(), HomeTextConfig, HomeTextManager(), HomeTextSentence

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (4): metadata, ORGANIZATION_JSON_LD, PERSON_JSON_LD, WEBSITE_JSON_LD

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (4): SMTPConfig, SMTPSettingsPanel(), Toggle(), ToggleProps

### Community 19 - "Community 19"
Cohesion: 0.40
Nodes (3): DocStatus, StoragePanel(), StorageStatus

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (3): CardItem, CardsManager(), generateId()

### Community 21 - "Community 21"
Cohesion: 0.50
Nodes (3): EMPTY_PROJECTS, ProjectItem, ProjectsManager()

## Knowledge Gaps
- **161 isolated node(s):** `nextConfig`, `name`, `version`, `private`, `node` (+156 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Breadcrumbs()` connect `Community 1` to `Community 9`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `useTheme()` connect `Community 3` to `Community 1`, `Community 12`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `requireAdmin()` connect `Community 2` to `Community 0`, `Community 10`, `Community 6`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `nextConfig`, `name`, `version` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06207482993197279 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06553911205073996 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10993657505285412 - nodes in this community are weakly interconnected._