import { Link } from 'react-router-dom'

import type { OfferItem } from '../../types'
import { formatCurrency } from '../../lib/format'
import { cn } from '../../lib/utils'
import { FoodItemImage } from '../primitives/food-item-image'

type LiveTickerProps = {
  offers: OfferItem[]
  className?: string
}

/** Scheduled price tape — horizontal newspaper ticker. */
export function LiveTicker({ offers, className }: LiveTickerProps) {
  if (!offers.length) return null

  const items = offers.slice(0, 10)
  const loop = [...items, ...items]

  return (
    <section
      className={cn(
        'group relative grid grid-cols-[auto_1fr] overflow-hidden border-y-2 border-[color:var(--color-text-primary)] bg-[color:var(--color-bg-card)]',
        className,
      )}
      aria-label="Scheduled price tape"
    >
      {/* Vertical TAPE label */}
      <div className="flex items-center justify-center bg-[color:var(--color-text-primary)] px-3 py-3">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-[color:var(--paper-50)]"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          § Price Tape
        </p>
      </div>

      {/* Scrolling rail */}
      <div className="relative overflow-hidden py-3">
        {/* fade edges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
          style={{ background: 'linear-gradient(to right, var(--color-bg-card) 0%, transparent 100%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
          style={{ background: 'linear-gradient(to left, var(--color-bg-card) 0%, transparent 100%)' }}
        />

        <div className="flex w-max animate-tape-horizontal items-center gap-0 group-hover:[animation-play-state:paused]">
          {loop.map((offer, i) => {
            const delta = offer.delta_vs_median_pct
            const isGoodValue = (delta ?? 0) > 0
            const isPremium = (delta ?? 0) < 0
            return (
              <Link
                key={`${offer.id}-${i}`}
                to={`/offers/${offer.id}`}
                className="flex shrink-0 items-center gap-3 whitespace-nowrap px-5 transition-colors hover:bg-[color:var(--paper-200)]"
              >
                <FoodItemImage src={offer.image_url} name={offer.display_name} category={offer.category} className="h-10 w-10" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                  {offer.source}
                </span>
                <span
                  className="font-display text-[14px] text-[color:var(--color-text-primary)]"
                  style={{ fontVariationSettings: "'opsz' 36, 'wght' 500" }}
                >
                  {offer.display_name}
                </span>
                <span className="num font-mono text-[14px] font-bold text-[color:var(--chili-500)]">
                  <span className="text-[10px] font-semibold text-[color:var(--color-text-muted)]">රු </span>
                  {formatCurrency(offer.price_lkr)}
                </span>
                {delta !== null && (
                  <span
                    className={cn(
                      'num font-mono text-[12px] font-bold',
                      isGoodValue && 'text-[color:var(--curry-leaf)]',
                      isPremium && 'text-[color:var(--chili-600)]',
                    )}
                  >
                    {isGoodValue ? '↘' : isPremium ? '↗' : '→'} {Math.abs(delta).toFixed(1)}%
                  </span>
                )}
                <span className="ml-4 text-[color:var(--color-border-strong)]" aria-hidden="true">
                  ‖
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

