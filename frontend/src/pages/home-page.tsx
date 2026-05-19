import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Bookmark, Scale, Search, ShoppingBasket, Waves } from 'lucide-react'

import { OfferCard } from '../components/ui/offer-card'
import { LiveTicker } from '../components/marketing/live-ticker'
import { FeatureBento } from '../components/marketing/feature-bento'
import { MarketIntelligenceBoard } from '../components/marketing/market-intelligence-board'
import { MarketPulseChart } from '../components/marketing/market-pulse-chart'
import { WorkflowCue } from '../components/ui/workflow-cue'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { usePlatformFreshness } from '../hooks/use-platform-freshness'
import { formatCompactDate, formatCurrency } from '../lib/format'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { ErrorState } from '../components/ui/workflow-helpers'

const workspace = [
  { title: 'Price Catalog', description: 'Search retail products and market items with photos, sources, and normalized prices.', href: '/items', icon: Search, accent: true },
  { title: 'Compare', description: 'Put districts or sources side by side and scan the biggest gaps first.', href: '/compare', icon: Scale },
  { title: 'Basket', description: 'Estimate household presets with availability and running totals.', href: '/basket', icon: ShoppingBasket },
  { title: 'Saved', description: 'Keep recurring baskets, comparisons, and offer views in one place.', href: '/watchlists', icon: Bookmark },
  { title: 'Markets', description: 'Read official wet-market quotes and district coverage.', href: '/markets', icon: Waves },
  { title: 'Insights', description: 'Inspect trends, source health, and confidence before publishing a decision.', href: '/intelligence', icon: BarChart3 },
]

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intel = useIntelligenceSummary()
  const freshnessQuery = usePlatformFreshness()
  const isLoading = homeQuery.isLoading || intel.isLoading
  const home = homeQuery.data
  const intelligence = intel.data
  const hasError = homeQuery.isError || intel.isError
  const movers = intelligence?.rankings.top_value ?? home?.spotlights.cheapest_offers ?? []
  const lead = movers[0]
  const supporting = (home?.spotlights.cheapest_offers ?? []).slice(0, 4)
  const trends = intelligence?.rankings.trend_snapshot?.slice(0, 5) ?? []
  const districts = home?.spotlights.market_quotes ?? []

  return (
    <div className="space-y-12">
      {hasError && (
        <ErrorState
          title="Today’s edition went to press with gaps"
          message="Some discovery or intelligence sections could not be refreshed."
          helper="You can still continue into retail discovery and compare workflows."
          onRetry={() => { void homeQuery.refetch(); void intel.refetch() }}
          links={[{ label: 'Open retail floor', to: '/retail' }, { label: 'Open intel desk', to: '/intelligence' }]}
        />
      )}

      <MarketIntelligenceBoard home={home} intelligence={intelligence} freshness={freshnessQuery.data} />

      <WorkflowCue
        id="home-start-here"
        eyebrow="Start here"
        title="Use FoodLK as a short decision path, not a dashboard maze."
        body="Search for the item first, compare where the price changes, then price a basket if the purchase is bigger than one line item."
        points={['Find the item', 'Compare the gap', 'Build the basket']}
        actionLabel="Open prices"
        actionTo="/items"
        secondaryActionLabel="Build basket"
        secondaryActionTo="/basket"
      />

      <MarketPulseChart />

      {!isLoading && movers.length > 0 && <LiveTicker offers={movers} />}

      <section className="grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:gap-x-12">
        <article className="min-w-0">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-kicker">§ Today’s lead signal</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">
              Updated {formatCompactDate(home?.hero.last_updated_at ?? null)}
            </span>
          </div>
          <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />

          {lead ? (
            <Link to={`/offers/${lead.id}`} className="group mt-6 block">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--chili-500)]">
                {lead.delta_vs_median_pct !== null && lead.delta_vs_median_pct > 0
                  ? `${lead.delta_vs_median_pct.toFixed(1)}% cheaper than median`
                  : lead.delta_vs_median_pct !== null && lead.delta_vs_median_pct < 0
                  ? `${Math.abs(lead.delta_vs_median_pct).toFixed(1)}% above median`
                  : 'Fresh off the latest scrape'}
              </p>
              <h2
                className="mt-3 max-w-[18ch] font-display tracking-normal text-[color:var(--color-text-primary)] group-hover:text-[color:var(--chili-700)]"
                style={{ fontSize: 'clamp(2rem, 4.4vw, 3.4rem)', lineHeight: '0.96', fontVariationSettings: "'opsz' 96, 'SOFT' 30, 'wght' 620" }}
              >
                {lead.display_name} <span className="font-display italic font-normal text-[color:var(--color-text-muted)]">at</span>{' '}
                <span className="num font-bold">රු {formatCurrency(lead.price_lkr)}</span>
              </h2>
              <p
                className="mt-4 max-w-[62ch] font-display text-[16px] leading-[1.55] text-[color:var(--color-text-secondary)]"
                style={{ fontVariationSettings: "'opsz' 24, 'wght' 400" }}
              >
                This offer is normalized to a per-{lead.unit ?? 'pack'} price and placed against comparable offers from the current catalog.
                Use it as the starting point, then compare districts or add the item to a basket before deciding.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 font-display text-[15px] italic text-[color:var(--color-text-primary)] underline decoration-1 underline-offset-[6px] transition-colors group-hover:text-[color:var(--chili-500)] group-hover:decoration-[color:var(--chili-500)]">
                Read the full offer
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </p>
            </Link>
          ) : (
            <SectionSkeleton cards={1} />
          )}

          {trends[0] && (
            <blockquote className="pull-quote mt-10">
              “{trends[0].canonical_name}” trades at a median of{' '}
              <span className="num not-italic font-bold">රු {formatCurrency(trends[0].median_price_lkr)}</span>{' '}
              across {trends[0].offers_count} live offers.
            </blockquote>
          )}

          {!isLoading && supporting.length > 0 && (
            <div className="mt-10 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
              {supporting.slice(0, 4).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </article>

        <aside className="space-y-8">
          <div>
            <span className="text-kicker">§ Where the data is strongest</span>
            <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />
            <dl className="mt-5 grid gap-[1px] bg-[color:var(--color-border)]">
              {[
                { label: 'Offers indexed', value: home?.kpis.offers_count ?? 0 },
                { label: 'Sources tracked', value: home?.kpis.sources_count ?? 0 },
                { label: 'Categories covered', value: home?.kpis.categories_count ?? 0 },
                { label: 'Market quotes', value: home?.kpis.market_quotes_count ?? 0 },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-[color:var(--color-bg-card)] p-4">
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-secondary)]">
                    {kpi.label}
                  </dt>
                  <dd className="num mt-2 text-[28px] font-bold leading-none tracking-normal text-[color:var(--color-text-primary)]">
                    {kpi.value.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <span className="text-kicker">§ Wet-market watch</span>
            <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />
            <ul className="mt-5 space-y-3">
              {(districts.length ? districts : Array.from({ length: 4 })).slice(0, 4).map((quote, i) => (
                <li key={(quote as { id?: number })?.id ?? i} className="flex items-baseline justify-between gap-3 border-b border-dotted border-[color:var(--color-border-hover)] pb-3">
                  {quote ? (
                    <>
                      <div className="min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                          {(quote as { district: string }).district}
                        </p>
                        <p
                          className="truncate font-display text-[15px] text-[color:var(--color-text-primary)]"
                          style={{ fontVariationSettings: "'opsz' 36, 'wght' 500" }}
                        >
                          {(quote as { item_name: string }).item_name}
                        </p>
                      </div>
                      <p className="num shrink-0 text-[18px] font-bold text-[color:var(--color-text-primary)]">
                        <span className="text-[10px] font-semibold text-[color:var(--color-text-muted)]">රු </span>
                        {formatCurrency((quote as { price_lkr: number }).price_lkr)}
                      </p>
                    </>
                  ) : (
                    <div className="shimmer h-8 w-full" />
                  )}
                </li>
              ))}
            </ul>
            <Link
              to="/markets"
              className="mt-4 inline-flex items-baseline gap-1.5 font-display text-[14px] italic text-[color:var(--color-text-primary)] underline decoration-1 underline-offset-[5px] transition-colors hover:text-[color:var(--chili-500)] hover:decoration-[color:var(--chili-500)]"
            >
              Read every district →
            </Link>
          </div>

          {trends.length > 0 && (
            <div>
              <span className="text-kicker">§ Retail trend snapshot</span>
              <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />
              <ul className="mt-5 space-y-2.5 font-mono text-[12px] tabular-nums">
                {trends.map((t, i) => (
                  <li key={t.cluster_key} className="flex items-baseline gap-3 border-b border-dotted border-[color:var(--color-border-hover)] pb-2">
                    <span className="num text-[10px] text-[color:var(--color-text-faint)]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className="flex-1 truncate font-display text-[14px] text-[color:var(--color-text-primary)]"
                      style={{ fontVariationSettings: "'opsz' 36" }}
                    >
                      {t.canonical_name}
                    </span>
                    <span className="num shrink-0 text-[13px] font-bold text-[color:var(--color-text-primary)]">
                      රු {formatCurrency(t.median_price_lkr)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-kicker">§ Choose the work surface</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">Daily paths</span>
        </div>
        <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />
        <p
          className="mt-5 max-w-[64ch] font-display text-[16px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
          style={{ fontVariationSettings: "'opsz' 36" }}
        >
          FoodLK is organized around the actual decision: find an item, compare the gap, build the basket, then inspect the trust layer.
        </p>
        <FeatureBento className="mt-7" items={workspace} />
      </section>
    </div>
  )
}
