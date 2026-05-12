import { Link } from 'react-router-dom'

import { OfferCard } from '../components/ui/offer-card'
import { SectionHeader } from '../components/ui/section-header'
import { StatCard } from '../components/ui/stat-card'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCompactDate, formatCurrency } from '../lib/format'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { ErrorState } from '../components/ui/workflow-helpers'

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intelligenceQuery = useIntelligenceSummary()
  const isLoading = homeQuery.isLoading || intelligenceQuery.isLoading
  const home = homeQuery.data
  const intelligence = intelligenceQuery.data
  const hasError = homeQuery.isError || intelligenceQuery.isError

  return (
    <div className="space-y-10">
      {hasError ? (
        <ErrorState
          title="Home signal coverage is partial"
          message="Some discovery or intelligence sections could not be refreshed."
          helper="You can still continue into retail discovery and compare workflows while background data reconnects."
          onRetry={() => {
            void homeQuery.refetch()
            void intelligenceQuery.refetch()
          }}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open intelligence desk', to: '/intelligence' },
          ]}
        />
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.26)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">{home?.hero.platform ?? 'Food platform'}</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{home?.hero.headline ?? 'Discovery and intelligence, one workflow'}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Start with discovery surfaces for fast decisions, then move into the intelligence desk when you need deeper trend confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/retail"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100"
            >
              Start discovery
            </Link>
            <Link
              to="/intelligence"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open intelligence desk
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Last refreshed {formatCompactDate(home?.hero.last_updated_at ?? null)}
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <SectionHeader
            eyebrow="Lead signal"
            title="What moved today"
            description="Discovery snapshot with provenance hints before you open deeper analysis."
          />
          {isLoading ? (
            <SectionSkeleton cards={2} className="mt-6" />
          ) : (
            <div className="mt-6 space-y-4">
              {(intelligence?.rankings.top_value ?? []).slice(0, 2).map((offer) => (
                <div key={offer.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{offer.source}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{offer.display_name}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Rs {formatCurrency(offer.price_lkr)} {offer.price_band ? `· ${offer.price_band}` : ''}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Provenance: {offer.source}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {isLoading ? (
        <SectionSkeleton cards={4} />
      ) : (
        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Offers indexed" value={formatCurrency(home?.kpis.offers_count)} helper="Normalized retail offers ready for search and ranking." />
          <StatCard label="Sources tracked" value={formatCurrency(home?.kpis.sources_count)} helper="Approved grocery feeds currently contributing live data." />
          <StatCard label="Categories covered" value={formatCurrency(home?.kpis.categories_count)} helper="Category pages and price boards built on the same aggregate layer." />
          <StatCard label="Market quotes" value={formatCurrency(home?.kpis.market_quotes_count)} helper="District market snapshots available for produce intelligence." />
        </section>
      )}

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Discovery"
          title="What moved today"
          description="Start with discovery cards for current retail opportunities, then branch into intelligence pages for deeper validation."
        />
        {isLoading ? (
          <SectionSkeleton cards={3} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {(home?.spotlights.cheapest_offers ?? []).map((offer) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <SectionHeader
            eyebrow="Discovery"
            title="Public market watch"
            description="Wet-market snapshots sit beside retail offers with source and timing context for quick trust checks."
          />
          {isLoading ? (
            <SectionSkeleton cards={2} className="mt-6" />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(home?.spotlights.market_quotes ?? []).map((quote) => (
                <article key={quote.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{quote.district}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{quote.market_name}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {quote.item_name} · Rs {formatCurrency(quote.price_lkr)} per {quote.unit}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                    Freshness: {formatCompactDate(quote.quoted_at ?? null)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_60px_rgba(201,111,29,0.12)]">
          <SectionHeader
            eyebrow="Intelligence"
            title="Decision workspace"
            description="Move from discovery into intelligence workflows when you need confidence, trend context, and basket execution."
          />
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
            <p>Track basket cost across presets and save repeat views into local watchlists.</p>
            <p>Escalate to trend and compare surfaces when decisions need deeper confidence.</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/basket" className="inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Open basket workspace
            </Link>
            <Link to="/methods" className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              Review methods
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
