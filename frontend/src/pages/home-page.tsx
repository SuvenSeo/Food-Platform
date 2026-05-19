import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Bookmark, Scale, Search, ShoppingBasket, Waves } from 'lucide-react'

import { OfferCard } from '../components/ui/offer-card'
import { LiveTicker } from '../components/marketing/live-ticker'
import { FeatureBento } from '../components/marketing/feature-bento'
import { MarketIntelligenceBoard } from '../components/marketing/market-intelligence-board'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { usePlatformFreshness } from '../hooks/use-platform-freshness'
import { formatCompactDate, formatCurrency } from '../lib/format'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { ErrorState } from '../components/ui/workflow-helpers'

const workspace = [
  { title: 'Price Catalog', description: 'Search items with photos, latest prices, sources, and history.', href: '/items', icon: Search, accent: true },
  { title: 'Compare', description: 'Side-by-side district and source deltas for quick decisions.', href: '/compare', icon: Scale },
  { title: 'Basket', description: 'Household preset baskets with availability-aware totals.', href: '/basket', icon: ShoppingBasket },
  { title: 'Saved', description: 'Clip pairs, presets, and offer views for later.', href: '/watchlists', icon: Bookmark },
  { title: 'Markets', description: 'Official wet-market quotes and district coverage.', href: '/markets', icon: Waves },
  { title: 'Insights', description: 'Rankings, trends, and source health for analysts.', href: '/intelligence', icon: BarChart3 },
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
    <div className="space-y-16">
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

      {/* ─────────── MASTHEAD ─────────── */}
      <header className="grid gap-y-8 lg:grid-cols-[1.45fr_1px_0.55fr] lg:gap-x-10">
        <div>
          <span className="stamp">Issue 01 · The Food Desk</span>
          <h1
            className="mt-7 font-display text-balance leading-[0.92] tracking-normal text-[color:var(--color-text-primary)]"
            style={{ fontSize: 'clamp(3.25rem, 9vw, 8.5rem)', fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 700" }}
          >
            The price of <em className="font-display italic font-normal text-[color:var(--chili-500)]">everything</em>, on one front page.
          </h1>

          <p className="text-lede mt-7 max-w-[58ch]">
            Daily wholesale and retail prices from across Sri Lanka — Spar, Glomark, Keells, Cargills,
            and the wet markets of Pettah, Kandy, Galle — normalised into one number per item.
          </p>

          <div className="mt-9">
            <div className="rule-dotted h-px w-full max-w-[420px]" aria-hidden="true" />
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to="/retail" className="fp-button-primary">
                Open the front page
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/intelligence"
                className="group inline-flex items-center gap-2 font-display text-[15px] italic text-[color:var(--color-text-primary)] underline decoration-1 underline-offset-[6px] transition-all hover:decoration-[color:var(--chili-500)] hover:text-[color:var(--chili-500)]"
              >
                Read the intelligence desk
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              Edition closed {formatCompactDate(home?.hero.last_updated_at ?? null)} · Colombo bureau
            </p>
          </div>
        </div>

        <div className="hidden self-stretch bg-[color:var(--color-border-hover)] lg:block" aria-hidden="true" />

        {/* Editor's brief */}
        <aside className="flex flex-col gap-5 lg:pt-2" aria-label="Editor's brief">
          <div className="flex items-baseline justify-between">
            <span className="text-kicker">§ Editor’s brief</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">P. 01</span>
          </div>
          <div className="rule-double h-1.5 w-full" aria-hidden="true" />
          <p
            className="font-display text-[16px] italic leading-[1.55] text-[color:var(--color-text-secondary)]"
            style={{
              fontVariationSettings: "'opsz' 36",
            }}
          >
            <span className="float-left mr-2 font-display text-[64px] font-bold not-italic leading-[0.85] text-[color:var(--chili-500)]">D</span>
            aily, our scrapers walk Spar, Glomark, Keells and Cargills shelves and gather what
            the wet markets quote in Pettah, Kandy, Galle. We normalise the noise so you can read
            one number per item and one trend per week — the way the news desk would want it.
          </p>
          <div className="rule-dotted h-px w-full" aria-hidden="true" />
          <div className="grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
            <div>
              <p className="num text-[24px] font-bold leading-none text-[color:var(--color-text-primary)]">04</p>
              <p className="mt-1">Retail chains</p>
            </div>
            <div>
              <p className="num text-[24px] font-bold leading-none text-[color:var(--color-text-primary)]">25</p>
              <p className="mt-1">Districts</p>
            </div>
            <div>
              <p className="num text-[24px] font-bold leading-none text-[color:var(--color-text-primary)]">3×</p>
              <p className="mt-1">Languages</p>
            </div>
          </div>
        </aside>
      </header>

      {/* ─────────── TODAY'S TAPE ─────────── */}
      {!isLoading && movers.length > 0 && (
        <LiveTicker offers={movers} />
      )}

      {/* ─────────── FRONT PAGE ─────────── */}
      <section className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-x-12">
        {/* LEFT — lead story */}
        <article>
          <div className="flex items-baseline justify-between">
            <span className="text-kicker">§ Lead story</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">By Mandiya · Today</span>
          </div>
          <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />

          {lead ? (
            <Link to={`/offers/${lead.id}`} className="group mt-6 block">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--chili-500)]">
                {lead.delta_vs_median_pct !== null && lead.delta_vs_median_pct > 0
                  ? `${lead.delta_vs_median_pct.toFixed(1)}% cheaper than median · biggest mover today`
                  : lead.delta_vs_median_pct !== null && lead.delta_vs_median_pct < 0
                  ? `${Math.abs(lead.delta_vs_median_pct).toFixed(1)}% above median · watchlist premium`
                  : 'Today’s top value, fresh off the scrape'}
              </p>
              <h2
                className="mt-3 font-display tracking-normal text-[color:var(--color-text-primary)] group-hover:text-[color:var(--chili-700)]"
                style={{ fontSize: 'clamp(2rem, 4.6vw, 3.4rem)', lineHeight: '0.96', fontVariationSettings: "'opsz' 96, 'SOFT' 30, 'wght' 600" }}
              >
                {lead.display_name} <span className="font-display italic font-normal text-[color:var(--color-text-muted)]">at</span>{' '}
                <span className="num font-bold">රු {formatCurrency(lead.price_lkr)}</span>
              </h2>
              <p
                className="mt-4 max-w-[58ch] font-display text-[16px] leading-[1.55] text-[color:var(--color-text-secondary)] [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:mt-1 [&::first-letter]:font-display [&::first-letter]:text-[58px] [&::first-letter]:font-bold [&::first-letter]:leading-[0.85] [&::first-letter]:text-[color:var(--color-text-primary)]"
                style={{ fontVariationSettings: "'opsz' 24, 'wght' 400" }}
              >
                Across {(home?.kpis.sources_count ?? 4)} retail chains and {(home?.kpis.market_quotes_count ?? 0).toLocaleString()} market quotes,
                this morning’s sweep flagged <em>{lead.brand ?? lead.display_name}</em> from
                <span className="font-mono uppercase tracking-[0.18em]"> {lead.source} </span> as the biggest mover.
                The number above is normalised to a per-{lead.unit ?? 'pack'} basis and compared to a median pulled from
                last seven days of similar offers.
              </p>
              <p className="mt-4 inline-flex items-baseline gap-2 font-display text-[15px] italic text-[color:var(--color-text-primary)] underline decoration-1 underline-offset-[6px] transition-colors group-hover:text-[color:var(--chili-500)] group-hover:decoration-[color:var(--chili-500)]">
                Read the full offer
                <span>→</span>
              </p>
            </Link>
          ) : (
            <SectionSkeleton cards={1} />
          )}

          {/* Pull-quote */}
          {trends[0] && (
            <blockquote className="pull-quote mt-10">
              “{trends[0].canonical_name}” trades at a median of{' '}
              <span className="num not-italic font-bold">රු {formatCurrency(trends[0].median_price_lkr)}</span>{' '}
              across {trends[0].offers_count} live offers this week.
            </blockquote>
          )}

          {/* Three-up supporting */}
          {!isLoading && supporting.length > 0 && (
            <div className="mt-10 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
              {supporting.slice(0, 4).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </article>

        {/* RIGHT — sidebar columns */}
        <aside className="space-y-10">
          {/* Numbers of the day */}
          <div>
            <span className="text-kicker">§ Numbers of the day</span>
            <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />
            <dl className="mt-5 space-y-4">
              {[
                { label: 'Offers indexed', value: home?.kpis.offers_count ?? 0 },
                { label: 'Sources tracked', value: home?.kpis.sources_count ?? 0 },
                { label: 'Categories covered', value: home?.kpis.categories_count ?? 0 },
                { label: 'Market quotes', value: home?.kpis.market_quotes_count ?? 0 },
              ].map((kpi) => (
                <div key={kpi.label} className="flex items-baseline justify-between border-b border-[color:var(--color-border)] pb-3">
                  <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-secondary)]">
                    {kpi.label}
                  </dt>
                  <dd className="num text-[28px] font-bold leading-none tracking-normal text-[color:var(--color-text-primary)]">
                    {kpi.value.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Market watch */}
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

          {/* Trend snapshot */}
          {trends.length > 0 && (
            <div>
              <span className="text-kicker">§ Trend snapshot</span>
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

      {/* ─────────── WORKSPACE / CLASSIFIEDS ─────────── */}
      <section>
        <div className="flex items-baseline justify-between">
          <span className="text-kicker">§ The Workshop</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">Pp. 02 — 07</span>
        </div>
        <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />
        <p
          className="mt-5 max-w-[64ch] font-display text-[16px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
          style={{ fontVariationSettings: "'opsz' 36" }}
        >
          Six work surfaces — each a separate column in the paper. Move from discovery into compare,
          basket, and intelligence as if turning a page.
        </p>
        <FeatureBento className="mt-7" items={workspace} />
      </section>
    </div>
  )
}
