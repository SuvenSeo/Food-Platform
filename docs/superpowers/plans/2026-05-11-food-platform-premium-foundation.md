# Food Platform Premium Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the MVP into a premium Phase A foundation with a stronger app shell, hybrid editorial/data homepage, richer summary APIs, and a cleaner frontend architecture that can support later intelligence, basket, and comparison features.

**Architecture:** Keep the existing FastAPI + React/Vite stack, but add server-side summary endpoints and split the frontend by page and feature responsibility. Phase A ships the new shell, homepage, intelligence landing page, methods page, upgraded retail/markets navigation, and the API payloads required to support those surfaces.

**Tech Stack:** FastAPI, SQLAlchemy, React 19, React Router, TanStack Query, Tailwind CSS, Vitest, pytest

---

### Task 1: Add premium summary API payloads

**Files:**
- Modify: `backend/app/api/v1/endpoints/public.py`
- Modify: `backend/tests/test_api.py`

- [ ] **Step 1: Write the failing backend tests for homepage and intelligence summaries**

```python
def test_homepage_summary_exposes_market_and_retail_signals() -> None:
    seed_api_data()

    response = client.get("/api/v1/home/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["hero"]["platform"] == "Sri Lanka Food Intelligence"
    assert payload["kpis"]["offers_count"] == 1
    assert payload["kpis"]["market_quotes_count"] == 2
    assert payload["spotlights"]["cheapest_offers"][0]["display_name"] == "SPAR Local Coconut Oil"


def test_intelligence_summary_exposes_rankings_and_freshness() -> None:
    seed_api_data()

    response = client.get("/api/v1/intelligence/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["rankings"]["top_value"][0]["price_band"] == "good-value"
    assert payload["sources"][0]["source"] == "spar2u"
```

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `.\.venv\Scripts\python -m pytest tests/test_api.py -k "homepage_summary or intelligence_summary" -v`

Expected: FAIL with `404 != 200` for the new routes.

- [ ] **Step 3: Implement the minimal summary endpoints in `public.py`**

```python
@router.get("/home/summary")
def home_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    latest_run = db.scalar(select(func.max(ScrapeRun.finished_at)))
    cheapest_rows = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .order_by(FoodOfferRecord.price_lkr.asc())
        .limit(3)
    ).all()

    return {
        "hero": {
            "platform": "Sri Lanka Food Intelligence",
            "headline": "Track how food prices move across retail shelves and public markets.",
            "last_updated_at": latest_run.isoformat() if latest_run else None,
        },
        "kpis": {
            "offers_count": db.scalar(select(func.count(FoodOfferRecord.id))) or 0,
            "sources_count": db.scalar(select(func.count(distinct(FoodOfferRecord.source)))) or 0,
            "categories_count": db.scalar(select(func.count(distinct(FoodOfferRecord.category)))) or 0,
            "market_quotes_count": db.scalar(select(func.count(MarketQuoteRecord.id))) or 0,
        },
        "spotlights": {
            "cheapest_offers": [
                {
                    "id": offer.id,
                    "display_name": offer.display_name,
                    "source": offer.source,
                    "price_lkr": float(offer.price_lkr),
                    "price_band": score.price_band if score else None,
                }
                for offer, score in cheapest_rows
            ],
        },
    }


@router.get("/intelligence/summary")
def intelligence_summary(db: Session = Depends(get_db)) -> dict[str, object]:
    ranking_rows = db.execute(
        select(FoodOfferRecord, FairPriceScoreRecord)
        .outerjoin(FairPriceScoreRecord, FairPriceScoreRecord.food_offer_id == FoodOfferRecord.id)
        .order_by(FoodOfferRecord.last_seen_at.desc())
        .limit(6)
    ).all()

    source_rows = db.scalars(select(ScrapeRun).order_by(ScrapeRun.finished_at.desc())).all()

    return {
        "rankings": {
            "top_value": [
                {
                    "id": offer.id,
                    "display_name": offer.display_name,
                    "source": offer.source,
                    "price_lkr": float(offer.price_lkr),
                    "price_band": score.price_band if score else None,
                }
                for offer, score in ranking_rows
            ],
        },
        "sources": [
            {
                "source": row.source,
                "status": row.status,
                "finished_at": row.finished_at.isoformat() if row.finished_at else None,
                "items_seen": row.items_seen,
                "items_stored": row.items_stored,
            }
            for row in source_rows[:4]
        ],
    }
```

- [ ] **Step 4: Run the targeted backend tests to verify they pass**

Run: `.\.venv\Scripts\python -m pytest tests/test_api.py -k "homepage_summary or intelligence_summary" -v`

Expected: PASS for both new tests.

- [ ] **Step 5: Run the full backend API test file**

Run: `.\.venv\Scripts\python -m pytest tests/test_api.py -v`

Expected: PASS for the existing API tests plus the new summary-route tests.


### Task 2: Split frontend routing and app shell into focused files

**Files:**
- Create: `frontend/src/app/routes.tsx`
- Create: `frontend/src/components/layout/app-shell.tsx`
- Create: `frontend/src/components/ui/stat-card.tsx`
- Create: `frontend/src/components/ui/offer-card.tsx`
- Create: `frontend/src/components/ui/pipeline-card.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components.tsx`
- Test: `frontend/src/test/dashboardApp.test.tsx`

- [ ] **Step 1: Write the failing frontend test for the new navigation model**

```tsx
it('renders the expanded premium navigation', async () => {
  renderApp(['/'])

  expect(await screen.findByRole('link', { name: /intelligence/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /markets/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /basket/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /methods/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the targeted frontend test to verify it fails**

Run: `npm run test -- --run dashboardApp.test.tsx`

Expected: FAIL because the current shell does not render the expanded nav.

- [ ] **Step 3: Create focused layout and UI component files**

```tsx
// frontend/src/components/layout/app-shell.tsx
const navItems = [
  { to: '/', label: 'Home' },
  { to: '/intelligence', label: 'Intelligence' },
  { to: '/retail', label: 'Retail' },
  { to: '/markets', label: 'Markets' },
  { to: '/categories', label: 'Categories' },
  { to: '/compare', label: 'Compare' },
  { to: '/basket', label: 'Basket' },
  { to: '/methods', label: 'Methods' },
  { to: '/pipeline', label: 'Pipeline' },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <nav className="mt-6 flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mt-8">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Update `App.tsx` to use the new route file**

```tsx
import { AppRoutes } from './app/routes'

export default function App() {
  return <AppRoutes />
}
```

- [ ] **Step 5: Re-export legacy symbols from `components.tsx` temporarily**

```tsx
export { AppShell } from './components/layout/app-shell'
export { OfferCard } from './components/ui/offer-card'
export { PipelineCard } from './components/ui/pipeline-card'
export { StatCard } from './components/ui/stat-card'
```

- [ ] **Step 6: Run the targeted frontend test to verify it passes**

Run: `npm run test -- --run dashboardApp.test.tsx`

Expected: PASS for the expanded navigation assertion.


### Task 3: Build the premium homepage and Phase A route surfaces

**Files:**
- Create: `frontend/src/pages/home-page.tsx`
- Create: `frontend/src/pages/intelligence-page.tsx`
- Create: `frontend/src/pages/retail-page.tsx`
- Create: `frontend/src/pages/markets-page.tsx`
- Create: `frontend/src/pages/categories-page.tsx`
- Create: `frontend/src/pages/compare-page.tsx`
- Create: `frontend/src/pages/basket-page.tsx`
- Create: `frontend/src/pages/methods-page.tsx`
- Create: `frontend/src/hooks/use-home-summary.ts`
- Create: `frontend/src/hooks/use-intelligence-summary.ts`
- Modify: `frontend/src/app/routes.tsx`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/test/dashboardApp.test.tsx`

- [ ] **Step 1: Write failing tests for the premium homepage and methods page**

```tsx
it('renders the premium homepage hero and spotlights', async () => {
  renderApp(['/'])

  expect(await screen.findByText(/sri lanka food intelligence/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /explore intelligence/i })).toBeInTheDocument()
  expect(screen.getByText(/what moved today/i)).toBeInTheDocument()
  expect(screen.getByText(/basket snapshot/i)).toBeInTheDocument()
})

it('renders the methods page', async () => {
  renderApp(['/methods'])

  expect(await screen.findByRole('heading', { name: /methods/i })).toBeInTheDocument()
  expect(screen.getByText(/normalization/i)).toBeInTheDocument()
  expect(screen.getByText(/fair-price/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Extend the API client and types to fetch the new summary routes**

```ts
export type HomeSummary = {
  hero: {
    platform: string
    headline: string
    last_updated_at: string | null
  }
  kpis: {
    offers_count: number
    sources_count: number
    categories_count: number
    market_quotes_count: number
  }
  spotlights: {
    cheapest_offers: OfferItem[]
  }
}

export type IntelligenceSummary = {
  rankings: {
    top_value: OfferItem[]
  }
  sources: PipelineItem[]
}

export const api = {
  // existing methods...
  getHomeSummary: () => fetchJson<HomeSummary>('/home/summary'),
  getIntelligenceSummary: () => fetchJson<IntelligenceSummary>('/intelligence/summary'),
}
```

- [ ] **Step 3: Implement the new page modules and hooks**

```tsx
// frontend/src/pages/home-page.tsx
export function HomePage() {
  const { data, isLoading } = useHomeSummary()
  const intelligence = useIntelligenceSummary()

  if (isLoading || intelligence.isLoading) return <LoadingBlock />

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-300">
            {data?.hero.platform}
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-tight">
            {data?.hero.headline}
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/intelligence">Explore intelligence</Link>
            <Link to="/basket">Build basket</Link>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Signals" title="What moved today" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {data?.spotlights.cheapest_offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Utility" title="Basket snapshot" />
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Add the new route tree**

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/intelligence" element={<IntelligencePage />} />
  <Route path="/retail" element={<RetailPage />} />
  <Route path="/markets" element={<MarketsPage />} />
  <Route path="/categories" element={<CategoriesPage />} />
  <Route path="/compare" element={<ComparePage />} />
  <Route path="/basket" element={<BasketPage />} />
  <Route path="/methods" element={<MethodsPage />} />
  <Route path="/pipeline" element={<PipelinePage />} />
  <Route path="/offers/:offerId" element={<OfferDetailPage />} />
</Routes>
```

- [ ] **Step 5: Run the targeted homepage and methods tests**

Run: `npm run test -- --run dashboardApp.test.tsx`

Expected: PASS for the premium homepage and methods-page tests.


### Task 4: Upgrade the visual system and typography

**Files:**
- Modify: `frontend/src/index.css`
- Create: `frontend/src/components/ui/section-header.tsx`
- Create: `frontend/src/components/ui/metric-strip.tsx`
- Modify: `frontend/src/components/layout/app-shell.tsx`
- Test: `frontend/src/test/dashboardApp.test.tsx`

- [ ] **Step 1: Write a failing test for the new editorial copy presence**

```tsx
it('shows the new premium headline copy instead of the old MVP heading', async () => {
  renderApp(['/'])

  expect(await screen.findByText(/track how food prices move across retail shelves and public markets/i)).toBeInTheDocument()
  expect(screen.queryByText(/^Food Price Intelligence$/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Replace the basic root styling with a stronger token-driven base**

```css
:root {
  --app-bg: #f6f1e8;
  --panel: rgba(255, 255, 255, 0.82);
  --ink: #0f172a;
  --muted: #475569;
  --accent: #c96f1d;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(201, 111, 29, 0.18), transparent 32%),
    radial-gradient(circle at top right, rgba(15, 23, 42, 0.08), transparent 28%),
    linear-gradient(180deg, #f6f1e8 0%, #fbfaf8 42%, #ffffff 100%);
}
```

- [ ] **Step 3: Add shared editorial helpers**

```tsx
export function SectionHeader({ eyebrow, title, description }: Props) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-3 text-base leading-7 text-slate-600">{description}</p> : null}
    </div>
  )
}
```

- [ ] **Step 4: Run the targeted frontend test to verify the premium copy passes**

Run: `npm run test -- --run dashboardApp.test.tsx`

Expected: PASS for the new headline-copy assertion and previously added route tests.

- [ ] **Step 5: Build the frontend production bundle**

Run: `npm run build`

Expected: PASS with Vite generating a production bundle.


### Task 5: Verification and repository setup

**Files:**
- Modify: `backend/tests/test_api.py`
- Modify: `frontend/src/test/dashboardApp.test.tsx`
- Create or modify: `.gitignore`

- [ ] **Step 1: Run the backend verification suite**

Run: `.\.venv\Scripts\python -m pytest tests/test_api.py`

Expected: PASS for all backend API tests.

- [ ] **Step 2: Run the frontend verification suite**

Run: `npm run test -- --run`

Expected: PASS for all frontend tests.

- [ ] **Step 3: Read IDE lints for touched files and fix any new issues**

Run tool: `ReadLints` on `frontend/src`, `backend/app/api/v1/endpoints/public.py`

Expected: no new diagnostics caused by Phase A changes.

- [ ] **Step 4: Initialize the repository if `.git/` is absent**

```bash
git init
git branch -M main
git remote add origin https://github.com/SuvenSeo/Food-Platform.git
```

- [ ] **Step 5: Commit the Phase A foundation changes**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: add premium foundation for food platform

Introduce richer summary APIs, a premium multi-page shell, and the first high-end homepage and intelligence surfaces so the food platform can grow beyond the MVP dashboard.
EOF
)"
```

- [ ] **Step 6: Push to the new GitHub repository**

Run: `git push -u origin main`

Expected: remote branch created successfully at `https://github.com/SuvenSeo/Food-Platform`.
