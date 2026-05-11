# Food Platform Premium Expansion Design

## Goal

Upgrade the Sri Lanka Food Price Intelligence Platform from a clean MVP dashboard into a premium, multi-page national food intelligence product that feels comparable in depth, usefulness, and visual quality to the sibling Property, Vehicle, and Octane platforms.

## Product Direction

The platform should evolve as a **layered food intelligence product**:

- The public homepage acts as the editorial front page for Sri Lankan food pricing.
- Deeper pages provide data-rich tools for comparison, monitoring, and household planning.
- Grocery, wet-market, and basket intelligence become one coherent product instead of separate widgets.
- The platform remains broadly useful to the public, but visually and structurally credible enough for media, analysts, and operators.

This direction deliberately avoids two failure modes:

1. A shallow consumer utility app that feels useful but not authoritative.
2. A broad “food super-platform” with too many weak surfaces and no clear core.

## Success Criteria

The expansion is successful when the product:

- Feels like a complete platform rather than a starter dashboard.
- Has a homepage with stronger typography, hierarchy, and editorial framing.
- Offers enough page depth that users can browse by market, retail channel, category, basket, and comparison workflow.
- Makes the current data model feel more useful through better aggregation, ranking, and explanation layers.
- Preserves the existing data pipeline strengths instead of replacing them with cosmetic-only changes.

## Product Principles

### 1. Premium but useful

Visual quality should reinforce trust and clarity, not just decoration. The UI needs stronger typography, better spacing rhythm, improved information density, and more deliberate hero/section treatment.

### 2. Broad public audience, serious data posture

The product is for everyone in Sri Lanka, but it should still present itself like a serious market intelligence platform. Consumer utility and analytical credibility should coexist.

### 3. Depth before breadth within each surface

New pages should each have a clear purpose and real utility. Avoid adding route shells that exist only to make the platform look larger.

### 4. Intelligence core, utility layer

The intelligence surfaces should remain the center of the product. Utility tools like baskets, watchlists, and comparison workflows should sit on top of the intelligence core rather than replace it.

## Information Architecture

The current structure is too small for the target experience. The product should expand into the following top-level pages:

- `Home`
- `Intelligence`
- `Retail`
- `Markets`
- `Categories`
- `Compare`
- `Basket`
- `Watchlists`
- `Methods`
- `Pipeline`

### Home

Purpose: present the strongest signals, major changes, and discovery paths in a premium editorial layout.

Key modules:

- Hero with strong headline, national food snapshot, and primary calls to action.
- KPI strip for offers, markets, categories, sources, and latest refresh.
- “What moved today” section with biggest risers, biggest drops, and notable bargains.
- Retail vs wet-market split panel.
- Category spotlight cards.
- Basket cost snapshot.
- District snapshot module.
- Link rail into sibling platforms as part of life-platform federation.

### Intelligence

Purpose: the main data-heavy dashboard for national food signals.

Key modules:

- Category momentum and major price movers.
- Cheapest cluster leaders.
- Premium vs fair vs bargain distribution.
- Store-source strength panels.
- District-level trend tables.
- Trend chart modules and ranking tables.

### Retail

Purpose: dedicated grocery and supermarket intelligence.

Key modules:

- Store comparison boards.
- Offer tables with richer filters.
- Brand and package-size comparisons.
- Cheapest source by cluster.
- Deal density and source freshness indicators.

### Markets

Purpose: dedicated wet-market intelligence by district and commodity.

Key modules:

- District overview cards.
- Market-by-market price boards.
- Commodity heat tables.
- District trend charts.
- Produce watch lists.

### Categories

Purpose: category-specific insight surfaces for vegetables, rice, dairy, snacks, beverages, pantry staples, and future food domains.

Key modules:

- Category hero and summary stats.
- Major clusters and leaders.
- Trend snapshots.
- District/store differences.
- Related basket impact.

### Compare

Purpose: structured side-by-side comparisons across stores, districts, categories, or selected products.

Key modules:

- Store vs store comparison.
- District vs district comparison.
- Category basket delta comparison.
- Product cluster comparison with per-unit normalization.

### Basket

Purpose: introduce a practical household-planning layer without turning the product into a generic budgeting app.

Key modules:

- Standard household basket presets.
- Basket totals by district/store/source.
- Cheapest basket routing suggestions.
- “What changed since last run/week” basket deltas.
- Substitution opportunities where a basket cluster has cheaper comparable options.

### Watchlists

Purpose: create repeat-use workflows for tracked items and views.

Key modules:

- Saved item watchlists.
- Saved district views.
- Saved basket views.
- Recently volatile tracked clusters.

Watchlists can launch as local-only persistence in the browser and later expand to server-backed accounts.

### Methods

Purpose: build trust and explain why the platform’s numbers should be believed.

Key modules:

- Source list and refresh cadence.
- Normalization methodology.
- Fair-price and ranking logic.
- Known limitations and disclaimers.
- Difference between retail quotes and wet-market quotes.

### Pipeline

Purpose: operational transparency, but with better product integration.

Key modules:

- Source freshness status.
- Last successful run per source.
- Seen/stored volume.
- Error state cards.
- Future planned domains and source roadmap.

## Homepage Experience

The homepage should follow a hybrid premium pattern:

1. **Editorial premium above the fold**
2. **Serious dashboard signals immediately below**
3. **Actionable exploration and utility sections further down**

### Hero

The hero should feel more like Property and Vehicle: stronger headline, sharper typography, more deliberate spacing, and a more ambitious framing statement. It should answer:

- What this platform is
- Why it matters nationally
- What the user can do immediately

Suggested content model:

- Eyebrow: “Sri Lanka Food Intelligence”
- Headline: strong national framing, not just “Food Price Intelligence”
- Supporting copy: retail + wet-market + household impact + daily relevance
- Primary CTA: `Explore intelligence`
- Secondary CTA: `Build basket`

### Typography direction

The current typography is too generic and small. The new direction should introduce:

- Larger, more assertive headlines.
- Tighter heading hierarchy.
- More deliberate section intros.
- Better contrast between editorial copy, dashboard labels, and data values.
- Better use of uppercase labels, numeric emphasis, and long-form explanatory text.

The visual target is not to mimic the sibling products exactly, but to borrow their stronger sense of confidence and hierarchy.

### Layout rhythm

The homepage should use alternating section densities:

- Hero / editorial
- Tight KPI strip
- Dense signal panels
- Medium-density category or market discovery cards
- A utility section
- A methods/transparency section

This prevents the page from feeling like one long wall of equally weighted cards.

## Feature Additions

The MVP already has the basic foundations for offers, trends, pipeline, and market quotes. The expansion should add the following product features in the first major upgrade.

### Intelligence features

- National food snapshot summary
- Biggest movers lists
- Cheapest normalized items leaderboard
- Most expensive/premium cluster boards
- Source freshness badges
- Category change boards
- District delta boards

### Utility features

- Basket presets
- Basket comparison by source/district
- Watchlists
- Saved views
- Quick compare workflows

### Discovery features

- Category landing pages
- District-focused market pages
- Store/source landing pages
- Related cluster navigation

### Trust and explanation features

- Methods page
- Score explanation callouts
- Source attribution on every meaningful surface
- Better empty, stale, and partial-data messaging

## Data and API Requirements

The current API is enough for the MVP, but not enough for the expanded product. The next version should add higher-level summary and breakdown endpoints instead of making the frontend compute everything from generic lists.

### Required new API shapes

- Homepage summary payload
- Intelligence dashboard payload
- Category directory payload
- Category detail payload
- District market overview payload
- Source/store overview payload
- Compare payloads for store-vs-store and district-vs-district
- Basket estimate and basket breakdown payloads
- Watchlist-compatible summary payloads

### Existing endpoint role after expansion

- `/stats/summary` remains a lightweight KPI source.
- `/offers` remains the core browse/search feed.
- `/offers/{id}` becomes a foundation for richer detail views.
- `/trends/{category}` becomes one of several trend feeds, not the only analytics feed.
- `/market-quotes` remains the raw market-quote browse endpoint.
- `/pipeline/status` remains the operational feed.
- `/hub/manifest` and `/hub/summary` remain the life-platform federation contract.

### Backend aggregation needs

Add summary services that compute:

- top movers
- cheapest clusters
- source freshness rankings
- basket totals
- district/category summary cards
- compare matrices

These should be produced server-side so the frontend stays focused on presentation.

## Frontend Architecture

The current frontend is too concentrated into `pages.tsx` and `components.tsx`. The expanded product should split along page and feature responsibilities.

Recommended structure:

- `src/app/` for routing and shared shell
- `src/components/ui/` for reusable primitives
- `src/components/marketing/` for hero, section headers, and editorial modules
- `src/components/intelligence/` for dashboards, leaders, trend cards, and rankings
- `src/components/basket/` for basket workflows
- `src/components/markets/` for wet-market and district components
- `src/components/retail/` for grocery/store components
- `src/components/watchlists/` for saved views
- `src/pages/` for page composition only
- `src/lib/api/` for API modules split by domain instead of one file
- `src/lib/format/` and `src/lib/constants/` for formatting and fixed labels
- `src/hooks/` for page-level query orchestration and URL state

### Routing evolution

The router should grow from the current handful of routes into a structured multi-page tree while keeping URL names simple and public-facing.

### State management

Continue using React Query for server state. Add URL-synced filters for compare, category, district, and retail browsing so views are shareable and navigable.

### Design system direction

Introduce:

- stronger section headers
- reusable hero blocks
- stat strips
- ranking tables
- comparison cards
- chart wrappers
- filter chips and query bars

Avoid adding a large ad hoc global stylesheet. Keep tokens and primitives centralized.

## Data Flow

### Retail path

Scrapers -> `raw_offers` -> normalized `food_offers` -> price aggregates -> fair-price scores -> summary services -> API payloads -> page-level React Query hooks -> UI modules

### Wet-market path

Market quote ingest -> `market_quotes` -> district/category summary services -> API payloads -> markets and homepage modules

### Basket path

Basket preset or selected items -> server-side comparison logic over normalized offers and quotes -> basket summary payload -> basket UI and watchlists

### Life-platform path

Food summary surfaces continue to publish stable JSON through the hub endpoints so the future life platform can consume them without coupling to internal routes.

## Error Handling and Partial Data

The richer product will encounter more partial-data states, so the design must account for them explicitly.

### Frontend states

Each major page/module should support:

- loading
- empty data
- stale data
- partial coverage
- fetch failure

### Product messaging

The UI should explain:

- when a category or district has thin coverage
- when data is from retail vs market quotes
- when a source is stale
- when a comparison is based on limited matches

The goal is for missing coverage to feel honestly explained, not broken.

## Testing Strategy

### Backend

Add tests for:

- summary services
- ranking logic
- basket comparison calculations
- compare payload generation
- category and district overview endpoints

### Frontend

Add tests for:

- homepage premium composition with data present and absent
- route-level rendering for new pages
- compare workflows
- basket calculations and rendering
- watchlist persistence behavior
- methods and transparency content rendering

### Browser verification

Use browser-based smoke checks for the homepage, at least one category page, one market page, one compare flow, and the basket experience.

## Implementation Phasing

This expansion should be built sequentially, not all at once.

### Phase A: Premium foundation

- Refactor frontend page/component structure
- Introduce stronger shell, typography, and section system
- Rebuild homepage
- Add richer summary endpoints

### Phase B: Intelligence depth

- Add intelligence page
- Add category pages
- Add retail and market overviews
- Add rankings, movers, and summary boards

### Phase C: Utility layer

- Add compare flows
- Add basket flows
- Add watchlists

### Phase D: Broader ecosystem hooks

- Prepare for restaurants, wholesale, and broader food-domain surfaces
- Strengthen hub-facing summary contracts

## Out of Scope For This Expansion

The following should not be treated as part of the first premium expansion:

- full authentication system
- notifications service
- restaurant ordering or delivery workflows
- merchant dashboards
- mobile app build
- deep life-platform SSO

These can come later after the product structure and core data surfaces are stable.

## Risks

### 1. Over-expansion

If too many new pages are added without strong payloads behind them, the platform will look broader but still feel thin.

Mitigation: each new page must have at least one clear core module and one strong reason to exist.

### 2. Frontend sprawl

If the current page/component files are simply appended to, the codebase will become harder to evolve.

Mitigation: split by feature/domain before adding the new product surfaces.

### 3. Client-side analytics creep

If the frontend starts computing rankings and basket logic from raw lists, complexity will spike and page quality will drop.

Mitigation: move summary computation server-side.

### 4. Trust erosion from thin data

A richer platform can overstate certainty if it doesn’t explain coverage gaps.

Mitigation: add explicit freshness, source, and coverage messaging on core modules.

## Recommendation

Proceed with a staged premium expansion centered on:

1. a rebuilt hybrid homepage,
2. a deeper intelligence layer,
3. dedicated retail and market pages,
4. category and comparison experiences,
5. a practical basket/watchlist utility layer.

This is the best path to making the platform feel like a real flagship product without losing the existing MVP’s clean delivery and data integrity.
