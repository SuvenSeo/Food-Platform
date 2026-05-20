import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Bell, Scale, Search, ShieldCheck } from 'lucide-react'

import { AlertSignup } from '../components/retention/alert-signup'
import { MarketIntelligenceBoard } from '../components/marketing/market-intelligence-board'
import { MarketPulseChart } from '../components/marketing/market-pulse-chart'
import { FoodItemImage } from '../components/primitives/food-item-image'
import { PriceSignalRow } from '../components/primitives/price-signal-row'
import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { ErrorState } from '../components/ui/workflow-helpers'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { usePlatformFreshness } from '../hooks/use-platform-freshness'
import { formatCompactDate, formatCurrency } from '../lib/format'

const decisionPath = [
  {
    title: 'Search the item',
    body: 'Start with a food name and open the item intelligence page, not a generic shelf browse.',
    href: '/prices',
    icon: Search,
  },
  {
    title: 'Compare the spread',
    body: 'Check where normalized prices diverge by district, source, and freshness window.',
    href: '/compare',
    icon: Scale,
  },
  {
    title: 'Save the signal',
    body: 'Clip the basket, comparison, or category alert so the next refresh has somewhere useful to land.',
    href: '/watchlists',
    icon: Bell,
  },
] as const

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intel = useIntelligenceSummary()
  const freshnessQuery = usePlatformFreshness()
  const home = homeQuery.data
  const intelligence = intel.data
  const hasError = homeQuery.isError || intel.isError
  const isLoading = homeQuery.isLoading || intel.isLoading
  const valueSignals = (intelligence?.rankings.top_value?.length
    ? intelligence.rankings.top_value
    : home?.spotlights.cheapest_offers ?? []
  ).slice(0, 5)
  const trends = intelligence?.rankings.trend_snapshot?.slice(0, 4) ?? []
  const quotes = home?.spotlights.market_quotes ?? []
  const latestStamp = formatCompactDate(home?.hero.last_updated_at ?? freshnessQuery.data?.freshness.last_scrape_at ?? null)
  const healthySources = freshnessQuery.data?.pipeline
    ? `${freshnessQuery.data.pipeline.healthy_sources}/${freshnessQuery.data.pipeline.total_sources}`
    : `${home?.kpis.sources_count ?? 0}`

  return (
    <div className="space-y-12">
      {hasError && (
        <ErrorState
          title="Price intelligence loaded with gaps"
          message="Some price or trend modules could not be refreshed."
          helper="Use the visible search and compare workflows while the missing module recovers."
          onRetry={() => { void homeQuery.refetch(); void intel.refetch() }}
          links={[{ label: 'Open prices', to: '/prices' }, { label: 'Open trends', to: '/intelligence' }]}
        />
      )}

      <MarketIntelligenceBoard home={home} intelligence={intelligence} freshness={freshnessQuery.data} />

      <section className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="min-w-0 space-y-5">
          <SectionHeader
            eyebrow="Price signals"
            title="Best value rows worth inspecting now"
            description={`Sorted for normalized food-price decisions. Last scheduled refresh: ${latestStamp}.`}
            level="h2"
          />
          {isLoading ? (
            <SectionSkeleton cards={4} />
          ) : (
            <div className="space-y-3">
              {valueSignals.map((offer, index) => (
                <PriceSignalRow key={offer.id} offer={offer} rank={index + 1} />
              ))}
              {!valueSignals.length && (
                <div className="border border-dashed border-[color:var(--color-border-hover)] bg-[color:var(--color-bg-card)] p-6 text-sm text-[color:var(--color-text-secondary)]">
                  Value signals are still calibrating. Search a specific item or inspect the source board.
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-5">
            <p className="text-kicker">Decision path</p>
            <div className="mt-4 space-y-3">
              {decisionPath.map(({ title, body, href, icon: Icon }, index) => (
                <Link
                  key={href}
                  to={href}
                  className="group grid grid-cols-[36px_1fr] gap-3 border-b border-dotted border-[color:var(--color-border-hover)] pb-3 last:border-b-0"
                >
                  <span className="flex h-9 w-9 items-center justify-center border border-[color:var(--color-border)] bg-[color:var(--paper-50)]">
                    <Icon className="h-4 w-4 text-[color:var(--chili-600)]" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-1 block font-display text-lg font-semibold text-[color:var(--color-text-primary)] group-hover:text-[color:var(--chili-600)]">
                      {title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[color:var(--color-text-secondary)]">{body}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-[1px] bg-[color:var(--color-border)]">
            {[
              { label: 'Sources checked', value: healthySources },
              { label: 'Trust grade', value: freshnessQuery.data?.confidence.grade ?? 'pending' },
              { label: 'Price rows', value: home?.kpis.offers_count?.toLocaleString() ?? '-' },
              { label: 'Market history', value: home?.kpis.market_quotes_count?.toLocaleString() ?? '-' },
            ].map((item) => (
              <div key={item.label} className="bg-[color:var(--color-bg-card)] p-4">
                <p className="text-kicker">{item.label}</p>
                <p className="num mt-2 text-2xl font-bold text-[color:var(--color-text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <MarketPulseChart />

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Market quote watch"
            title="Latest public-market lines"
            description="Useful as directional context beside retail prices; dates matter more than dramatic wording."
            level="h2"
          />
          <div className="space-y-3">
            {quotes.length
              ? quotes.slice(0, 3).map((quote) => (
                <article key={quote.id} className="grid grid-cols-[64px_1fr_auto] gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4">
                  <FoodItemImage
                    src={quote.image_url}
                    name={quote.item_name}
                    category={quote.category}
                    source={quote.market_name}
                    className="h-16 w-16"
                  />
                  <div className="min-w-0">
                    <p className="text-kicker">{quote.district} · {quote.market_name}</p>
                    <h3 className="mt-2 truncate font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
                      {quote.item_name}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
                      Quoted {formatCompactDate(quote.quoted_at)}
                    </p>
                  </div>
                  <p className="num text-2xl font-bold text-[color:var(--color-text-primary)]">
                    <span className="text-sm text-[color:var(--color-text-muted)]">රු </span>
                    {formatCurrency(quote.price_lkr)}
                  </p>
                </article>
              ))
              : Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="shimmer h-24 border border-[color:var(--color-border)]" />
              ))}
          </div>
          <Link to="/markets" className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--chili-600)]">
            Inspect source data
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-5">
          <SectionHeader
            eyebrow="Trends and alerts"
            title="Turn a price check into a recurring watch"
            description="Use trends for context and save an alert only where the workflow is visible."
            level="h2"
          />
          <div className="grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
            {trends.map((trend, index) => (
              <div key={trend.cluster_key} className="bg-[color:var(--color-bg-card)] p-4">
                <div className="flex items-start gap-3">
                  <FoodItemImage
                    src={trend.image_url}
                    name={trend.canonical_name}
                    category={trend.brand}
                    className="h-14 w-14"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-[color:var(--color-text-faint)]">{String(index + 1).padStart(2, '0')}</p>
                    <h3 className="mt-2 truncate font-display text-lg font-semibold text-[color:var(--color-text-primary)]">{trend.canonical_name}</h3>
                  </div>
                </div>
                <p className="num mt-2 text-xl font-bold text-[color:var(--color-text-primary)]">
                  රු {formatCurrency(trend.median_price_lkr)}
                </p>
                <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">{trend.offers_count} retail rows</p>
              </div>
            ))}
          </div>
          <AlertSignup
            compact
            defaultScope="category"
            defaultScopeValue={trends[0]?.canonical_name ?? 'grocery'}
            title="Save a price watch"
            subtitle="Create a category or district alert. If email delivery is not configured, FoodLK will clearly save it in preview mode."
          />
          <div className="flex flex-wrap gap-3">
            <Link to="/intelligence" className="fp-button-secondary text-xs">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              Open trends
            </Link>
            <Link to="/methods" className="fp-button-secondary text-xs">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Source methods
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
