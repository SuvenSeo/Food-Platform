import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BarChart3, Bell, GitCompareArrows, Search, ShieldCheck } from 'lucide-react'

import { FoodItemImage } from '../primitives/food-item-image'
import type { HomeSummary, IntelligenceSummary, PlatformFreshnessSummary } from '../../types'
import { formatCompactDate, formatCurrency } from '../../lib/format'
import { bestItemImage } from '../../lib/item-images'

type MarketIntelligenceBoardProps = {
  home?: HomeSummary
  intelligence?: IntelligenceSummary
  freshness?: PlatformFreshnessSummary
}

export function MarketIntelligenceBoard({ home, intelligence, freshness }: MarketIntelligenceBoardProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const leadOffer = intelligence?.rankings.top_value?.[0] ?? home?.spotlights.cheapest_offers?.[0]
  const latestQuote = home?.spotlights.market_quotes?.[0]
  const trend = intelligence?.rankings.trend_snapshot?.[0]
  const warnings = freshness?.pipeline.blocking_warnings ?? []
  const sourceHealth = freshness?.pipeline
    ? `${freshness.pipeline.healthy_sources}/${freshness.pipeline.total_sources}`
    : `${home?.kpis.sources_count ?? 0}`
  const confidence = freshness?.confidence.grade ?? 'pending'
  const confidenceLabel = confidence === 'high' ? 'High trust' : confidence === 'medium' ? 'Watch grade' : confidence === 'low' ? 'Validate first' : 'Pending'
  const latestStamp = formatCompactDate(home?.hero.last_updated_at ?? freshness?.generated_at ?? null)
  const topSignals = useMemo(
    () => (intelligence?.rankings.top_value?.length ? intelligence.rankings.top_value : home?.spotlights.cheapest_offers ?? []).slice(0, 3),
    [home?.spotlights.cheapest_offers, intelligence?.rankings.top_value],
  )
  const imageCandidates = useMemo(
    () => [
      ...(intelligence?.rankings.top_value ?? []),
      ...(home?.spotlights.cheapest_offers ?? []),
      ...(intelligence?.rankings.trend_snapshot ?? []),
      ...(home?.spotlights.market_quotes ?? []),
    ],
    [
      home?.spotlights.cheapest_offers,
      home?.spotlights.market_quotes,
      intelligence?.rankings.top_value,
      intelligence?.rankings.trend_snapshot,
    ],
  )

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/prices?search=${encodeURIComponent(trimmed)}` : '/prices')
  }

  const kpis = [
    { label: 'Tracked prices', value: home?.kpis.offers_count?.toLocaleString() ?? '-', note: 'normalized retail rows' },
    { label: 'Market history', value: home?.kpis.market_quotes_count?.toLocaleString() ?? '-', note: 'official and public quote points' },
    { label: 'Sources checked', value: sourceHealth, note: 'scheduled feeds in the trust window' },
    { label: 'Confidence', value: confidenceLabel, note: warnings.length ? `${warnings.length} source warning${warnings.length === 1 ? '' : 's'}` : 'no blocking source warnings' },
  ]

  return (
    <section className="market-board" aria-label="FoodLK market overview">
      <article className="market-board-panel market-board-lead">
        <span className="text-kicker text-[color:var(--turmeric)]">§ FoodLK price intelligence</span>
        <h1
          className="mt-4 max-w-[13ch] font-display text-[clamp(2.5rem,5.4vw,5rem)] font-semibold leading-[0.94] text-[color:var(--paper-50)]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 660" }}
        >
          Sri Lanka food price intelligence.
        </h1>
        <p className="mt-5 max-w-[46ch] text-sm leading-7 text-[color:var(--paper-300)]">
          Search a staple, compare normalized prices, inspect trends, then save the signal before the next scheduled refresh.
        </p>

        <form onSubmit={submitSearch} className="mt-7 grid gap-2 rounded-none border border-white/20 bg-white/[0.08] p-2 sm:grid-cols-[1fr_auto]">
          <label className="relative min-w-0">
            <span className="sr-only">Search food prices</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--paper-300)]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 w-full bg-transparent pl-10 pr-3 font-display text-[17px] text-[color:var(--paper-50)] placeholder:text-[color:var(--paper-400)] focus:outline-none"
              placeholder="Search rice, dhal, coconut oil..."
            />
          </label>
          <button type="submit" className="fp-button-primary bg-[color:var(--paper-50)] text-[color:var(--ink-900)] hover:bg-[color:var(--turmeric)] hover:text-[color:var(--ink-900)]">
            Search prices
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-2" aria-label="Primary homepage actions">
          <Link to="/compare" className="fp-button-secondary border-white/25 text-[color:var(--paper-50)] hover:border-[color:var(--turmeric)] hover:bg-white/[0.08] hover:text-[color:var(--turmeric)]">
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            Compare item
          </Link>
          <Link to="/intelligence" className="fp-button-secondary border-white/25 text-[color:var(--paper-50)] hover:border-[color:var(--turmeric)] hover:bg-white/[0.08] hover:text-[color:var(--turmeric)]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Trends
          </Link>
          <Link to="/watchlists" className="fp-button-secondary border-white/25 text-[color:var(--paper-50)] hover:border-[color:var(--turmeric)] hover:bg-white/[0.08] hover:text-[color:var(--turmeric)]">
            <Bell className="h-4 w-4" aria-hidden="true" />
            Saved alerts
          </Link>
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-400)]">
          Latest scheduled refresh {latestStamp}
        </p>
      </article>

      {kpis.map((kpi) => (
        <article key={kpi.label} className="market-board-panel market-board-kpi bg-[color:var(--paper-50)]">
          <span className="text-kicker">§ {kpi.label}</span>
          <p className="num mt-4 text-4xl font-bold leading-none text-[color:var(--color-text-primary)]">
            {kpi.value}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
            {kpi.note}
          </p>
        </article>
      ))}

      <article className="market-board-panel market-board-signal bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ Best normalized signal</span>
        {leadOffer ? (
          <>
            <FoodItemImage
              src={leadOffer.image_url}
              name={leadOffer.display_name}
              category={leadOffer.category}
              source={leadOffer.source}
              className="mt-4 h-40 w-full"
              imgClassName="p-2"
              priority
            />
            <p className="mt-4 font-display text-2xl leading-tight text-[color:var(--color-text-primary)]">
              {leadOffer.display_name}
            </p>
            <p className="num mt-3 text-3xl font-bold text-[color:var(--chili-600)]">
              රු {formatCurrency(leadOffer.price_lkr)}
            </p>
            <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
              {leadOffer.delta_vs_median_pct == null
                ? 'Median comparison still calibrating.'
                : `${Math.abs(leadOffer.delta_vs_median_pct).toFixed(1)}% ${leadOffer.delta_vs_median_pct > 0 ? 'below' : 'above'} its current median.`}
            </p>
            <Link to={`/offers/${leadOffer.id}`} className="market-board-link">
              Inspect signal <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className="mt-4 text-sm text-[color:var(--color-text-secondary)]">Retail source comparison is loading.</p>
        )}
      </article>

      <article className="market-board-panel bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ Wet-market signal</span>
        {latestQuote && (
          <FoodItemImage
            src={bestItemImage(latestQuote.item_name, imageCandidates, latestQuote.image_url)}
            name={latestQuote.item_name}
            category={latestQuote.category}
            source={latestQuote.market_name}
            className="mt-4 h-32 w-full"
            imgClassName="p-2"
          />
        )}
        <p className="mt-4 font-display text-2xl leading-tight text-[color:var(--color-text-primary)]">
          {latestQuote ? `${latestQuote.item_name} · ${latestQuote.district}` : 'No market quote yet'}
        </p>
        <p className="num mt-3 text-3xl font-bold text-[color:var(--color-text-primary)]">
          රු {formatCurrency(latestQuote?.price_lkr)}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
          {formatCompactDate(latestQuote?.quoted_at ?? null)}
        </p>
      </article>

      <article className="market-board-panel bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ History to inspect</span>
        {trend && (
          <FoodItemImage
            src={bestItemImage(trend.canonical_name, imageCandidates, trend.image_url)}
            name={trend.canonical_name}
            category={trend.brand}
            className="mt-4 h-32 w-full"
            imgClassName="p-2"
          />
        )}
        <p className="mt-4 font-display text-2xl leading-tight text-[color:var(--color-text-primary)]">
          {trend?.canonical_name ?? 'Trend series loading'}
        </p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
          Median {trend ? `රු ${formatCurrency(trend.median_price_lkr)}` : 'pending'} across {trend?.offers_count ?? 0} offers.
        </p>
        <Link to="/intelligence" className="market-board-link">
          Open trends <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>

      <article className="market-board-panel market-board-list bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ Current comparison queue</span>
        <div className="mt-4 space-y-3">
          {topSignals.map((offer, index) => (
            <Link
              key={offer.id}
              to={`/offers/${offer.id}`}
              className="grid grid-cols-[auto_56px_1fr_auto] items-center gap-3 border-b border-dotted border-[color:var(--color-border-hover)] pb-3 last:border-b-0"
            >
              <span className="num font-mono text-[10px] text-[color:var(--color-text-faint)]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <FoodItemImage
                src={offer.image_url}
                name={offer.display_name}
                category={offer.category}
                className="h-14 w-14"
              />
              <span className="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">{offer.display_name}</span>
              <span className="num text-sm font-bold text-[color:var(--chili-600)]">රු {formatCurrency(offer.price_lkr)}</span>
            </Link>
          ))}
          {!topSignals.length && (
            <p className="text-sm text-[color:var(--color-text-secondary)]">Top value signals are loading.</p>
          )}
        </div>
      </article>

      <nav className="market-board-actions" aria-label="Primary food price workflows">
        {[
          { label: 'Prices', to: '/prices', icon: Search },
          { label: 'Compare', to: '/compare', icon: GitCompareArrows },
          { label: 'Trends', to: '/intelligence', icon: BarChart3 },
          { label: 'Sources', to: '/methods', icon: ShieldCheck },
        ].map(({ label, to, icon: Icon }) => (
          <Link key={to} to={to} className="market-board-action">
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </section>
  )
}
