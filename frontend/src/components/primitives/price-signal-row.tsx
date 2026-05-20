import { Link } from 'react-router-dom'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'

import { formatCompactDate, formatCurrency } from '../../lib/format'
import type { OfferItem } from '../../types'
import { FoodItemImage } from './food-item-image'

function deltaCopy(delta: number | null) {
  if (delta === null) return { label: 'Median pending', className: 'text-[color:var(--color-text-muted)]' }
  if (delta > 5) return { label: `${delta.toFixed(1)}% below median`, className: 'text-[color:var(--curry-leaf)]' }
  if (delta < -5) return { label: `${Math.abs(delta).toFixed(1)}% above median`, className: 'text-[color:var(--chili-600)]' }
  return { label: 'Near median', className: 'text-[color:var(--color-text-muted)]' }
}

export function PriceSignalRow({ offer, rank }: { offer: OfferItem; rank?: number }) {
  const unitPrice = offer.normalized_unit_price_lkr ?? offer.price_per_unit_lkr
  const unitLabel = offer.normalized_unit ?? offer.unit ?? 'unit'
  const delta = deltaCopy(offer.delta_vs_median_pct)
  const confidence = Math.round((offer.normalization_confidence ?? 0) * 100)

  return (
    <article className="grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 transition hover:border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-bg-card-hover)] md:grid-cols-[48px_64px_minmax(0,1.35fr)_minmax(150px,0.7fr)_minmax(150px,0.7fr)_auto] md:items-center">
      <p className="num font-mono text-xs font-bold text-[color:var(--color-text-muted)]">
        {rank ? String(rank).padStart(2, '0') : '—'}
      </p>

      <FoodItemImage
        src={offer.image_url}
        name={offer.display_name}
        category={offer.category}
        source={offer.source}
        className="h-16 w-16"
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--chili-600)]">
            {offer.source}
          </span>
          {offer.price_band && (
            <span className="border border-[color:var(--color-border)] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
              {offer.price_band}
            </span>
          )}
        </div>
        <h3 className="mt-2 truncate font-display text-xl font-semibold leading-tight text-[color:var(--color-text-primary)]">
          {offer.display_name}
        </h3>
        <p className="mt-1 truncate text-sm text-[color:var(--color-text-secondary)]">
          {offer.category} · updated {formatCompactDate(offer.last_seen_at)}
        </p>
      </div>

      <div>
        <p className="text-kicker">Shelf price</p>
        <p className="num mt-1 text-2xl font-bold text-[color:var(--color-text-primary)]">
          <span className="text-sm text-[color:var(--color-text-muted)]">රු </span>
          {formatCurrency(offer.price_lkr)}
        </p>
      </div>

      <div>
        <p className="text-kicker">Normalized</p>
        <p className="num mt-1 text-xl font-bold text-[color:var(--color-text-primary)]">
          {unitPrice ? (
            <>
              <span className="text-sm text-[color:var(--color-text-muted)]">රු </span>
              {formatCurrency(unitPrice)}
              <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]">
                / {unitLabel}
              </span>
            </>
          ) : '—'}
        </p>
        <p className={`mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${delta.className}`}>
          {delta.label}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-muted)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--curry-leaf)]" aria-hidden="true" />
          {confidence}% normalized
        </span>
        <Link
          to={`/offers/${offer.id}`}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--chili-600)] transition hover:text-[color:var(--chili-700)]"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
