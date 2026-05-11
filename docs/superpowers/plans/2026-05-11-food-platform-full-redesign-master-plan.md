# Food Platform Full Redesign + Phase Fixes Master Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-ready full redesign while first closing current regressions and contract gaps, then delivering page-depth upgrades, trust surfaces, and release hardening in controlled phases.

**Architecture:** Use a phased, contract-first rollout across backend (`FastAPI` + SQLAlchemy) and frontend (`React` + React Router + TanStack Query), with every phase gated by executable quality checks and explicit rollback paths. Prioritize stabilization before visual/feature expansion to avoid compounding failures.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, pytest, React 19, React Router, TanStack Query, Vite, Vitest, ESLint, Tailwind CSS

---

## 1) Repository Reality Snapshot (as of 2026-05-11)

### Baseline quality status

- Backend API tests: `13 passed, 3 failed` in `backend/tests/test_api.py`.
  - Missing basket summary shape (`totals_by_kind`, `availability_status`, `availability_reason`, `alternatives`).
  - Missing `GET /api/v1/compare/sources`.
  - Missing retention endpoints (`GET /api/v1/retention/subscriptions/schema`, `POST /api/v1/retention/subscriptions/preview`).
- Backend pipeline tests: `5 passed` in `backend/tests/test_food_pipeline.py`.
- Frontend tests: `3 passed, 6 failed`, with hook order/runtime loop errors in `markets`, `categories`, and dependent flows.
- Frontend lint: failing (`react-hooks/rules-of-hooks`, `preserve-manual-memoization` errors).
- Frontend build: passing (`npm run build` succeeds).

### Existing platform scope already present

- Multi-page route tree includes: Home, Intelligence, Retail, Markets, Categories, Compare, Basket, Watchlists, Methods, Developers, Privacy, Terms, Pipeline, Offer Detail.
- API already exposes summary and utility endpoints including:
  - `/api/v1/home/summary`
  - `/api/v1/intelligence/summary`
  - `/api/v1/categories/summary`
  - `/api/v1/compare/districts`
  - `/api/v1/basket/estimate`
  - `/api/v1/hub/manifest`, `/api/v1/hub/summary`

This plan assumes redesign work continues from this current state (not from MVP baseline).

---

## 2) Workstream Model (Parallel, Coordinated)

## WS-A: Backend Contract & Aggregation
- Owns API payload contracts, missing endpoints, and serialization compatibility.

## WS-B: Frontend Experience & Interaction
- Owns route-level UX, hook safety, visual redesign implementation, and page continuity.

## WS-C: Quality Gates & Validation
- Owns test/lint/build gates, smoke scripts, and pre-release validation evidence.

## WS-D: Release Coordination
- Owns merge sequencing, risk tracking, rollback drills, and deploy readiness.

**Coordination rule:** WS-A merges contract changes before WS-B consumes them. WS-C blocks promotion if any phase gate fails.

---

## 3) Master Phases

## Phase 0 - Stabilize Existing Regressions (Hard Blocker)

**Intent:** Resolve current failing tests/hook errors before new redesign scope.

**Depends on:** none (entry phase).

### Checklist (measurable gates)

- [ ] Implement missing basket response fields required by current tests.
- [ ] Implement `compare/sources` endpoint with parity to district compare response semantics.
- [ ] Implement retention schema + preview endpoints with test-aligned contract.
- [ ] Remove conditional hook execution and render-loop triggers in `categories`, `markets`, and dependent pages.
- [ ] Update/expand tests only where behavior intentionally changes; avoid masking failures.
- [ ] Achieve green baseline gates in Validation Matrix for Phase 0.

### Acceptance criteria

- `backend/tests/test_api.py` passes fully.
- `frontend/src/test/dashboardApp.test.tsx` passes fully.
- `npm run lint` passes with zero errors.
- Existing routes render without hook-order runtime exceptions.

### Primary risks

- API shape drift between tests and implementation.
- Frontend hook fixes introducing subtle data filter regressions.

### Rollback strategy

- Revert basket/compare/retention additions behind endpoint-level rollback (remove route registration if needed).
- For frontend, revert only affected page modules while preserving shared shell/styles.

---

## Phase 1 - Contract Alignment + Redesign Foundations

**Intent:** Lock stable API/frontend contracts and shared design primitives before deeper page expansion.

**Depends on:** Phase 0 complete.

### Checklist (measurable gates)

- [ ] Publish and freeze typed frontend contracts for all redesigned data surfaces (`home`, `intelligence`, `categories`, `compare`, `basket`, `watchlists`, `pipeline`).
- [ ] Normalize API error handling and ensure user-facing fallback copy for 404/empty/stale states.
- [ ] Consolidate reusable UI foundations (section headers, cards, loading/error wrappers, token usage).
- [ ] Remove stale duplicate module paths (`pages.tsx`/`components.tsx` legacy indirection where no longer needed).
- [ ] Verify no route dead-ends: every top-level page links to at least one adjacent workflow.

### Acceptance criteria

- No contract mismatch between backend payloads and frontend types.
- Shared primitives used by all top-level routes.
- Offer detail 404 and other empty/error states are intentional and user-readable.

### Primary risks

- Uncoordinated contract edits across teams.
- Visual consistency regressions from mixed old/new components.

### Rollback strategy

- Keep legacy-compatible fields for one phase window (deprecate later).
- Revert design primitive changes independently from route content if styling destabilizes.

---

## Phase 2 - Core Workflow Redesign (Retail/Markets/Categories/Compare/Basket/Watchlists)

**Intent:** Deliver dense, actionable workflows for core intelligence and planning journeys.

**Depends on:** Phase 1 contract freeze.

### Checklist (measurable gates)

- [ ] Retail page: source-focused ranking/filter workflows and stable sort/filter state.
- [ ] Markets page: district/category exploration with consistent trend and quote density.
- [ ] Categories page: category coverage + price context with clear retail/market split.
- [ ] Compare page: district and source compare modes with meaningful deltas and empty-state handling.
- [ ] Basket page: multi-preset comparison and save-to-watchlist continuity.
- [ ] Watchlists page: reactive updates from local storage and persisted saved views.

### Acceptance criteria

- All workflow pages complete primary user action without dead-end.
- Filter/sort state changes are deterministic and test-covered.
- Watchlists persistence behavior is stable across navigation and refresh.

### Primary risks

- Increased UI complexity causing performance regressions.
- Inconsistent compare semantics across district vs source modes.

### Rollback strategy

- Feature-flag compare source mode separately from district mode.
- Keep previous basket preset behavior available while new metadata rolls out.

---

## Phase 3 - Trust, Transparency, and Public Product Surfaces

**Intent:** Make the product externally credible through methodology and public-facing platform pages.

**Depends on:** Phase 2 route stability.

### Checklist (measurable gates)

- [ ] Methods page expanded with freshness, normalization, scoring, and limitations.
- [ ] Developers, Privacy, and Terms pages linked from global footer and main nav.
- [ ] Source attribution and freshness cues visible on all major data views.
- [ ] Hub contract (`manifest`/`summary`) kept accurate with available pages and utility surfaces.
- [ ] Copy pass removes internal roadmap wording from user-facing surfaces.

### Acceptance criteria

- Every top-level user page has discoverable trust/legal/developer pathways.
- Methods page explains data provenance and caveats with concrete language.
- Hub endpoints reflect current page map and dataset routes accurately.

### Primary risks

- Public-facing claims outpacing real data coverage.
- Footer/nav changes introducing route regressions.

### Rollback strategy

- Revert trust-surface content independently from core workflow routes.
- Keep previous hub payload keys stable while adding new optional fields.

---

## Phase 4 - Final Hardening, Release, and Post-Release Safety Net

**Intent:** Finalize launch quality with regression sweeps, smoke validation, and operational rollback readiness.

**Depends on:** Phases 0-3 complete and green.

### Checklist (measurable gates)

- [ ] End-to-end smoke run across core routes and key API endpoints on release candidate.
- [ ] Resolve all blocker lint/test failures and triage remaining non-blocking warnings.
- [ ] Verify production build artifact health and routing behavior (`vercel.json` rewrite path).
- [ ] Create release notes with known limitations and rollback triggers.
- [ ] Run rollback rehearsal for frontend deploy and API rollback scenario.

### Acceptance criteria

- Validation matrix is fully green for Phase 4.
- No P0/P1 open defects in core flows.
- Rollback checklist is documented and tested.

### Primary risks

- Late regressions from parallel merges.
- Shipping with unresolved known data/contract inconsistencies.

### Rollback strategy

- Frontend: redeploy previous successful artifact immediately.
- Backend: revert to prior tagged API commit; keep DB schema backward compatible during rollout window.

---

## 4) Validation Matrix by Phase

| Phase | Automated tests | Lint | Build | Smoke flows |
|---|---|---|---|---|
| Phase 0 | `cd backend && .\.venv\Scripts\python -m pytest tests/test_api.py -q` and `cd frontend && npm run test -- --run` | `cd frontend && npm run lint` | `cd frontend && npm run build` | API: `/api/v1/basket/estimate?preset=essentials`, `/api/v1/compare/sources?left=seed-colombo&right=seed-kandy`, `/api/v1/retention/subscriptions/schema` |
| Phase 1 | Same as Phase 0 + targeted contract tests touched in current PR | `cd frontend && npm run lint` | `cd frontend && npm run build` | UI: `/`, `/intelligence`, `/offers/999` (404 UX), `/methods` |
| Phase 2 | `cd backend && .\.venv\Scripts\python -m pytest tests/test_api.py -q`; `cd frontend && npm run test -- --run` | `cd frontend && npm run lint` | `cd frontend && npm run build` | UI: `/retail`, `/markets`, `/categories`, `/compare`, `/basket`, `/watchlists` |
| Phase 3 | Same as Phase 2 (full suite) | `cd frontend && npm run lint` | `cd frontend && npm run build` | UI: `/methods`, `/developers`, `/privacy`, `/terms`; API: `/api/v1/hub/manifest`, `/api/v1/hub/summary` |
| Phase 4 | Full repeat: `test_api.py`, `test_food_pipeline.py`, frontend full tests | `cd frontend && npm run lint` | `cd frontend && npm run build` | End-to-end path: Home -> Compare -> Basket -> Watchlists -> Offer detail missing state |

**Gate policy:** A phase is complete only when all matrix entries pass for that phase.

---

## 5) Release Strategy

## Branching and parallel delivery

- Keep one integration branch for each phase (e.g., `phase-0-stabilization`, `phase-1-foundation`).
- Use short-lived feature branches per workstream (`ws-a/*`, `ws-b/*`, `ws-c/*`).
- Require WS-C validation report before merging any branch into a phase integration branch.

## Merge order (conflict-minimizing)

1. Backend contracts and serialization updates (WS-A).
2. Frontend type/client updates consuming those contracts (WS-B core plumbing).
3. Route/page behavior and UI redesign modules (WS-B feature slices).
4. Test updates and lint cleanup (WS-C).
5. Docs and release notes (WS-D) immediately before phase cut.

## Conflict minimization guidance

- Freeze shared files during high-risk windows (`frontend/src/types.ts`, `frontend/src/lib/api.ts`, backend public endpoints file).
- Prefer additive API changes first; remove deprecated fields only one phase later.
- Batch PRs by domain (retail vs markets vs compare) to reduce overlapping edits.
- Rebase feature branches daily during active phase windows.
- Require one owner for each shared file during a phase sprint.

## Promotion flow

- Promote only one phase at a time to `main`.
- After each phase merge, run full matrix in CI/local and complete smoke flows before starting next phase merge.
- Keep a release candidate tag at end of every phase for quick rollback.

---

## 6) Rollback and Risk Register (Cross-Phase)

## Top cross-phase risks

1. **Contract drift risk:** frontend and backend evolve asynchronously.
2. **Hook safety regressions:** page-level refactors reintroduce render-order bugs.
3. **False green risk:** build passes while tests/lint fail.
4. **Scope bleed risk:** trust/public pages expand without stable core workflows.

## Mitigations

- Contract-first merge order.
- Mandatory hook/lint gates before any page-level redesign merge.
- Phase completion requires full matrix, not just build success.
- Explicit out-of-scope lock: no auth overhaul, no mobile app, no new external source onboarding in this redesign plan.

## Rollback triggers

- Any P0 route broken in smoke flows.
- Reintroduced hook-order runtime exception.
- API endpoint returning incompatible payload to released frontend.
- Critical user journey fails: Compare -> Basket -> Watchlists.

---

## 7) Definition of Done (Master)

The redesign program is complete when:

- All phase acceptance criteria are met.
- Validation matrix is green for final phase.
- Core user flows and trust/public pages are stable in smoke validation.
- Rollback plan is documented, tested, and ready.
- Documentation reflects shipped behavior and known limitations.

