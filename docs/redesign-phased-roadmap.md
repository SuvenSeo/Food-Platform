# Food Platform Redesign Roadmap

This roadmap executes the full platform redesign in controlled phases while keeping production behavior stable.

## Phase 1 (current)

- Fix critical reliability and security issues:
  - reactive watchlists state
  - proper `404` for missing offer detail
  - admin key hardening in non-development environments
  - FastAPI startup migration to lifespan
  - timezone-aware UTC usage in active runtime paths
- Introduce redesign foundation (global tokens, typography rhythm, shared layout primitives) without route changes.
- Add/update tests for changed behavior and run backend/frontend verification gates.

## Phase 2

- Redesign the core workflow pages (`Home`, `Retail`, `Markets`, `Compare`, `Basket`) with a shared component system.
- Add richer empty/error/loading states and better cross-page workflow continuity.
- Strengthen API contract handling in the frontend (typed errors and user-friendly fallbacks across data pages).

## Phase 3

- Expand trust and product depth surfaces (`Methods`, `Developers`, policy pages, footer ecosystem links).
- Add retention and productivity loops (saved views evolution, quick actions, alerts-ready UX scaffolding).
- Introduce dashboard-level consistency pass for spacing, hierarchy, and accessibility states.

## Phase 4

- Full visual polish and hardening pass:
  - responsive and accessibility QA sweep
  - performance pass (bundle, rendering, perceived-load polish)
  - copy and IA tightening for launch readiness
- Final regression + deployment readiness checklist across API, frontend, and docs.
