# Graph Report - Development  (2026-08-10)

## Corpus Check
- 3 files · ~9,324 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 34 nodes · 43 edges · 6 communities (4 shown, 2 thin omitted)
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.95)
- Token cost: 75,828 input · 0 output

## Community Hubs (Navigation)
- Admin Dashboard & Theming
- Auth Bug & Save Point ED04
- Landing Page Sections
- Cube Reveal & Neon Sphere
- Save Point ED01
- Save Point ED02

## God Nodes (most connected - your core abstractions)
1. `Save Point ED04 (Roadmap)` - 7 edges
2. `Landing Home Page` - 6 edges
3. `Save Point ED04` - 6 edges
4. `CubeReveal (Roadmap)` - 4 edges
5. `Neon Sphere (GLSL Shader)` - 3 edges
6. `CubeReveal Component` - 3 edges
7. `Ash Text Section` - 3 edges
8. `Cards Section Choreography` - 3 edges
9. `Admin Duplicate-Route Auth-Bypass Bug` - 3 edges
10. `Admin Dashboard (Roadmap)` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Landing Home Page` --conceptually_related_to--> `Landing Home Page (Roadmap)`  [INFERRED]
  CLAUDE.md → Implementation/Roadmap.md
- `CubeReveal Component` --conceptually_related_to--> `CubeReveal (Roadmap)`  [INFERRED]
  CLAUDE.md → Implementation/Roadmap.md
- `Cards Section Choreography` --conceptually_related_to--> `Cards Section (Roadmap)`  [INFERRED]
  CLAUDE.md → Implementation/Roadmap.md
- `Theme System` --conceptually_related_to--> `Theme System (Roadmap)`  [INFERRED]
  CLAUDE.md → Implementation/Roadmap.md
- `Admin Dashboard` --conceptually_related_to--> `Admin Dashboard (Roadmap)`  [INFERRED]
  CLAUDE.md → Implementation/Roadmap.md

## Hyperedges (group relationships)
- **ED04 Save Point Fix Cluster** — claude_neon_sphere, claude_cube_reveal, claude_admin_auth_bypass_bug, claude_visitor_counter, claude_mawebsitedb_sql [EXTRACTED 1.00]
- **Pinned Scroll Sections** — claude_cards_section, claude_ash_text_section, claude_cube_reveal, claude_overflow_x_clip_rule [EXTRACTED 1.00]
- **Roadmap Save Point Timeline** — implementation_roadmap_ed01_savepoint, implementation_roadmap_ed02_savepoint, implementation_roadmap_ed03_savepoint, implementation_roadmap_ed04_savepoint [EXTRACTED 1.00]

## Communities (6 total, 2 thin omitted)

### Community 0 - "Admin Dashboard & Theming"
Cohesion: 0.20
Nodes (9): Admin Dashboard, Governance Rules, Project Overview, Theme System, Admin Dashboard (Roadmap), In Progress Items, Not Started Items, Admin SMTP Settings (+1 more)

### Community 1 - "Auth Bug & Save Point ED04"
Cohesion: 0.36
Nodes (8): Admin Duplicate-Route Auth-Bypass Bug, Save Point ED04, MAWebsiteDB.sql Migration Schema, Visitor Counter, Admin Auth-Bypass Security Fix, Save Point ED04 (Roadmap), MAWebsiteDB.sql (Roadmap), Visitor Counter (Roadmap)

### Community 2 - "Landing Page Sections"
Cohesion: 0.29
Nodes (8): Ash Text Section, Cards Section Choreography, CubeReveal Component, Landing Home Page, Layered Architecture, Modular Agile Iterative (MAI) Model, overflow-x-clip Sticky Rule, Landing Home Page (Roadmap)

### Community 3 - "Cube Reveal & Neon Sphere"
Cohesion: 0.33
Nodes (6): Neon Sphere (GLSL Shader), Cards Section (Roadmap), CubeReveal (Roadmap), Save Point ED03, Known Follow-ups (ED04/ED02), Neon Sphere (Roadmap)

## Knowledge Gaps
- **8 isolated node(s):** `Project Overview`, `Layered Architecture`, `Theme System`, `Admin SMTP Settings`, `Save Point Ed01` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Landing Home Page` connect `Landing Page Sections` to `Cube Reveal & Neon Sphere`?**
  _High betweenness centrality (0.353) - this node is a cross-community bridge._
- **Why does `Landing Home Page (Roadmap)` connect `Landing Page Sections` to `Admin Dashboard & Theming`?**
  _High betweenness centrality (0.246) - this node is a cross-community bridge._
- **Why does `Save Point ED04` connect `Auth Bug & Save Point ED04` to `Landing Page Sections`, `Cube Reveal & Neon Sphere`?**
  _High betweenness centrality (0.216) - this node is a cross-community bridge._
- **What connects `Project Overview`, `Layered Architecture`, `Theme System` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._