import { Link } from 'react-router-dom'

import { OfferCard } from '../components/ui/offer-card'
import { SectionHeader } from '../components/ui/section-header'
import { StatCard } from '../components/ui/stat-card'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCompactDate, formatCurrency } from '../lib/format'
import { LoadingBlock } from '../components/ui/loading-block'

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intelligenceQuery = useIntelligenceSummary()

  if (homeQuery.isLoading || intelligenceQuery.isLoading) {
    return <LoadingBlock />
  }

  const home = homeQuery.data
  const intelligence = intelligenceQuery.data

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-[0_30px_80px_rgba(15,23,42,0.26)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-300">{home?.hero.platform}</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{home?.hero.headline}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Editorial framing up front, serious dashboards underneath, and practical tools layered in as the platform
            grows into a national food intelligence product.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/intelligence"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-100"
            >
              Explore intelligence
            </Link>
            <Link
              to="/basket"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Build basket
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
            description="Fast signal surfaces for top value offers and fresh market quotes."
          />
          <div className="mt-6 space-y-4">
            {intelligence?.rankings.top_value.slice(0, 2).map((offer) => (
              <div key={offer.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{offer.source}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{offer.display_name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Rs {formatCurrency(offer.price_lkr)} {offer.price_band ? `· ${offer.price_band}` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Offers indexed" value={formatCurrency(home?.kpis.offers_count)} helper="Normalized retail offers ready for search and ranking." />
        <StatCard label="Sources tracked" value={formatCurrency(home?.kpis.sources_count)} helper="Approved grocery feeds currently contributing live data." />
        <StatCard label="Categories covered" value={formatCurrency(home?.kpis.categories_count)} helper="Category pages and price boards built on the same aggregate layer." />
        <StatCard label="Market quotes" value={formatCurrency(home?.kpis.market_quotes_count)} helper="District market snapshots available for produce intelligence." />
      </section>

      <section className="space-y-6">
        <SectionHeader
          eyebrow="Signals"
          title="What moved today"
          description="The premium homepage now leads with a quick editorial read on value and coverage instead of a plain dashboard grid."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {home?.spotlights.cheapest_offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <SectionHeader
            eyebrow="Markets"
            title="Public market watch"
            description="Wet-market snapshots sit beside retail offers so district pricing is part of the same product story."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {home?.spotlights.market_quotes.map((quote) => (
              <article key={quote.id} className="rounded-[1.5rem] bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{quote.district}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">{quote.market_name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {quote.item_name} · Rs {formatCurrency(quote.price_lkr)} per {quote.unit}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_60px_rgba(201,111,29,0.12)]">
          <SectionHeader
            eyebrow="Utility"
            title="Basket snapshot"
            description="This section becomes the bridge into household tools without changing the product’s intelligence-first posture."
          />
          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
            <p>Track the cost of a household basket across sources, districts, and future category presets.</p>
            <p>Phase A introduces the landing surface here before the deeper basket workflow ships.</p>
          </div>
          <Link to="/basket" className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Open basket workspace
          </Link>
        </div>
      </section>
    </div>
  )
}
