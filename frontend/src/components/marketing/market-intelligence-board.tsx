import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, GitCompareArrows, Search, ShieldCheck, ShoppingBasket } from 'lucide-react'

import type { HomeSummary, IntelligenceSummary, PlatformFreshnessSummary } from '../../types'
import { formatCompactDate, formatCurrency } from '../../lib/format'

type MarketIntelligenceBoardProps = {
  home?: HomeSummary
  intelligence?: IntelligenceSummary
  freshness?: PlatformFreshnessSummary
}

export function MarketIntelligenceBoard({ home, intelligence, freshness }: MarketIntelligenceBoardProps) {
  const leadOffer = intelligence?.rankings.top_value?.[0] ?? home?.spotlights.cheapest_offers?.[0]
  const latestQuote = home?.spotlights.market_quotes?.[0]
  const trend = intelligence?.rankings.trend_snapshot?.[0]
  const warnings = freshness?.pipeline.blocking_warnings ?? []
  const sourceHealth = freshness?.pipeline
    ? `${freshness.pipeline.healthy_sources}/${freshness.pipeline.total_sources}`
    : `${home?.kpis.sources_count ?? 0}`
  const confidence = freshness?.confidence.grade ?? 'pending'
  const confidenceLabel = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Watch' : confidence === 'low' ? 'Low' : 'Pending'
  const latestStamp = formatCompactDate(home?.hero.last_updated_at ?? freshness?.generated_at ?? null)

  const kpis = [
    { label: 'Retail offers', value: home?.kpis.offers_count?.toLocaleString() ?? '—', note: 'normalized shelf prices' },
    { label: 'Market quotes', value: home?.kpis.market_quotes_count?.toLocaleString() ?? '—', note: 'public-market observations' },
    { label: 'Sources live', value: sourceHealth, note: 'feeds inside the trust window' },
    { label: 'Trust grade', value: confidenceLabel, note: warnings.length ? `${warnings.length} feed warning${warnings.length === 1 ? '' : 's'}` : 'ready for daily decisions' },
  ]

  return (
    <section className="market-board" aria-label="FoodLK market overview">
      <div className="market-board-photo" aria-hidden="true" />

      <article className="market-board-panel market-board-lead">
        <span className="text-kicker text-[color:var(--turmeric)]">§ FoodLK · Mandiya</span>
        <h1
          className="mt-4 max-w-[14ch] font-display text-[clamp(2.35rem,5.2vw,4.7rem)] font-semibold leading-[0.94] text-[color:var(--paper-50)]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 660" }}
        >
          Sri Lanka food prices before you shop.
        </h1>
        <p className="mt-5 max-w-[46ch] text-sm leading-7 text-[color:var(--paper-300)]">
          Search a product, compare districts, price a basket, or inspect the data quality behind every signal.
        </p>
        <div className="mt-7 flex flex-wrap gap-2" aria-label="Primary homepage actions">
          <Link to="/items" className="fp-button-primary bg-[color:var(--paper-50)] text-[color:var(--ink-900)] hover:bg-[color:var(--turmeric)] hover:text-[color:var(--ink-900)]">
            Open prices
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/compare" className="fp-button-secondary border-white/25 text-[color:var(--paper-50)] hover:border-[color:var(--turmeric)] hover:bg-white/[0.08] hover:text-[color:var(--turmeric)]">
            <GitCompareArrows className="h-4 w-4" aria-hidden="true" />
            Compare districts
          </Link>
          <Link to="/basket" className="fp-button-secondary border-white/25 text-[color:var(--paper-50)] hover:border-[color:var(--turmeric)] hover:bg-white/[0.08] hover:text-[color:var(--turmeric)]">
            <ShoppingBasket className="h-4 w-4" aria-hidden="true" />
            Build basket
          </Link>
          <Link to="/intelligence" className="fp-button-secondary border-white/25 text-[color:var(--paper-50)] hover:border-[color:var(--turmeric)] hover:bg-white/[0.08] hover:text-[color:var(--turmeric)]">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
            Insights
          </Link>
        </div>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-400)]">
          Updated {latestStamp}
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

      <article className="market-board-panel bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ Best value</span>
        <p className="mt-4 font-display text-2xl leading-tight text-[color:var(--color-text-primary)]">
          {leadOffer?.display_name ?? 'Waiting for retail scrape'}
        </p>
        <p className="num mt-3 text-3xl font-bold text-[color:var(--chili-600)]">
          රු {formatCurrency(leadOffer?.price_lkr)}
        </p>
        <Link to={leadOffer ? `/offers/${leadOffer.id}` : '/retail'} className="market-board-link">
          Open offer <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>

      <article className="market-board-panel bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ Wet-market signal</span>
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
        <span className="text-kicker">§ Trend to watch</span>
        <p className="mt-4 font-display text-2xl leading-tight text-[color:var(--color-text-primary)]">
          {trend?.canonical_name ?? 'Trend series loading'}
        </p>
        <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
          Median {trend ? `රු ${formatCurrency(trend.median_price_lkr)}` : 'pending'} across {trend?.offers_count ?? 0} offers.
        </p>
        <Link to="/intelligence" className="market-board-link">
          Open desk <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </article>

      <nav className="market-board-actions" aria-label="Primary food price workflows">
        {[
          { label: 'Prices', to: '/items', icon: Search },
          { label: 'Compare', to: '/compare', icon: GitCompareArrows },
          { label: 'Basket', to: '/basket', icon: ShoppingBasket },
          { label: 'Insights', to: '/intelligence', icon: BarChart3 },
          { label: 'Methods', to: '/methods', icon: ShieldCheck },
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
