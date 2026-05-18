import { Link } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'

import type { OfferItem } from '../../types'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'

type LiveTickerProps = {
  offers: OfferItem[]
  className?: string
}

export function LiveTicker({ offers, className }: LiveTickerProps) {
  if (!offers.length) return null

  const items = offers.slice(0, 6)
  const loop = [...items, ...items]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-border bg-surface-elevated/60',
        className,
      )}
      aria-label="Today's price movers"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <span className="live-dot-orange" aria-hidden="true" />
        <p className="eyebrow-accent">Today&apos;s movers</p>
      </div>
      <div className="ticker-track flex">
        {loop.map((offer, i) => (
          <Link
            key={`${offer.id}-${i}`}
            to={`/offers/${offer.id}`}
            className="ticker-item flex min-w-[220px] shrink-0 items-center gap-3 border-r border-border px-4 py-3 transition hover:bg-white/[0.04]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{offer.display_name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {offer.source}
              </p>
            </div>
            <div className="text-right">
              <p className="num text-sm font-semibold text-brand-400">
                Rs {formatCurrency(offer.price_lkr)}
              </p>
              {offer.delta_vs_median_pct !== null && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-[10px] font-semibold',
                    offer.delta_vs_median_pct < 0 ? 'text-emerald-400' : 'text-amber-400',
                  )}
                >
                  {offer.delta_vs_median_pct < 0 ? (
                    <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />
                  ) : (
                    <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                  )}
                  {Math.abs(offer.delta_vs_median_pct).toFixed(1)}%
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

