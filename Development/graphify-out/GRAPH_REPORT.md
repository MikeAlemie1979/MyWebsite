# Graph Report - Development  (2026-08-08)

## Corpus Check
- 2 files · ~1,662 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 26 nodes · 24 edges · 6 communities (5 shown, 1 thin omitted)
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

## God Nodes (most connected - your core abstractions)
1. `Architecture & Design Principles` - 4 edges
2. `Current Implementation` - 4 edges
3. `Important Guidelines` - 4 edges
4. `Roadmap` - 4 edges
5. `Development Workflow` - 2 edges
6. `Project Overview` - 1 edges
7. `Project Structure` - 1 edges
8. `Key Commands (Next.js)` - 1 edges
9. `Layered Architecture` - 1 edges
10. `Development Approach` - 1 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (6 total, 1 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.29
Nodes (5): Asset & Sprint Organization, Project Overview, Project Structure, Quick Reference, References & Further Reading

### Community 1 - "admin-dashboard.tsx"
Cohesion: 0.40
Nodes (4): Completed, In Progress, Not Started, Roadmap

### Community 2 - "admin-auth.ts"
Cohesion: 0.50
Nodes (4): Architecture & Design Principles, Development Approach, Governance Rules (CRITICAL), Layered Architecture

### Community 3 - "compilerOptions"
Cohesion: 0.50
Nodes (4): Before Making Changes, File Naming Conventions, Important Guidelines, When Adding Features

### Community 4 - "dependencies"
Cohesion: 0.50
Nodes (4): Current Implementation, Existing Components & Features, In Progress, Tech Stack Details

## Knowledge Gaps
- **18 isolated node(s):** `Project Overview`, `Project Structure`, `Key Commands (Next.js)`, `Layered Architecture`, `Development Approach` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Architecture & Design Principles` connect `admin-auth.ts` to `app/page.tsx`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `Current Implementation` connect `dependencies` to `app/page.tsx`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **Why does `Important Guidelines` connect `compilerOptions` to `app/page.tsx`?**
  _High betweenness centrality (0.180) - this node is a cross-community bridge._
- **What connects `Project Overview`, `Project Structure`, `Key Commands (Next.js)` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._