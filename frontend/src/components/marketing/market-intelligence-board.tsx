import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Code2, GitCompareArrows, ShoppingBasket } from 'lucide-react'

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

  return (
    <section className="market-board" aria-label="Live market board">
      <div className="market-board-photo" aria-hidden="true" />

      <article className="market-board-panel market-board-lead">
        <span className="text-kicker">§ Live market board</span>
        <h2
          className="mt-4 max-w-[11ch] font-display text-[clamp(2.3rem,7vw,5.6rem)] font-semibold leading-[0.92] text-[color:var(--paper-50)]"
          style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 660" }}
        >
          Trust first. Prices second.
        </h2>
        <p className="mt-5 max-w-[42ch] text-sm leading-7 text-[color:var(--paper-300)]">
          Mandiya now opens with source health, normalized units, and action paths before pushing people into tables.
        </p>
      </article>

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
        <span className="text-kicker">§ Coverage</span>
        <div className="mt-4 grid grid-cols-2 gap-[1px] bg-[color:var(--color-border)]">
          <div className="bg-[color:var(--paper-100)] p-3">
            <p className="num text-2xl font-bold">{home?.kpis.offers_count?.toLocaleString() ?? '—'}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">offers</p>
          </div>
          <div className="bg-[color:var(--paper-100)] p-3">
            <p className="num text-2xl font-bold">{home?.kpis.market_quotes_count?.toLocaleString() ?? '—'}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">quotes</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-[color:var(--color-text-secondary)]">
          {warnings.length ? `${warnings.length} feeds are blocking full confidence.` : 'Expected feeds are inside the trust window.'}
        </p>
      </article>

      <article className="market-board-panel bg-[color:var(--paper-50)]">
        <span className="text-kicker">§ Trend anchor</span>
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
          { label: 'Alerts', to: '/watchlists', icon: Bell },
          { label: 'Compare', to: '/compare', icon: GitCompareArrows },
          { label: 'Basket', to: '/basket', icon: ShoppingBasket },
          { label: 'API', to: '/developers', icon: Code2 },
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
