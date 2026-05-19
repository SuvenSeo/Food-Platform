import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ImageOff } from 'lucide-react'

import { formatCompactDate, formatCurrency } from '../../lib/format'
import type { OfferItem } from '../../types'
import { cn } from '../../lib/utils'

const SOURCE_LABELS: Record<string, string> = {
  spar2u: 'Spar',
  glomark: 'Glomark',
  keells: 'Keells',
  cargills: 'Cargills',
}

const SOURCE_TILT: Record<string, number> = {
  spar2u: -2.5,
  glomark: 2,
  keells: -3.2,
  cargills: 1.5,
}

/* — Mandiya Stall Card — image left, big mono price right, rotated source sticker — */

function StallThumb({ src, alt, label }: { src?: string | null; alt: string; label: string }) {
  const [errored, setErrored] = useState(false)
  const initials = label.slice(0, 2).toUpperCase()

  if (!src || errored) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-[color:var(--paper-200)] text-[color:var(--ink-400)]">
        <ImageOff className="h-6 w-6 opacity-50" aria-hidden="true" />
        <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">{initials}</span>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[color:var(--paper-200)]">
      <div className="absolute inset-0 bg-halftone bg-halftone-md opacity-[0.07]" aria-hidden="true" />
      <img
        src={src}
        alt={alt}
        className="relative z-10 h-full w-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.06]"
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
      />
    </div>
  )
}

function DeltaMark({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-faint)]">
        calibrating
      </span>
    )
  }

  const isCheap = delta > 5
  const isExpensive = delta < -5
  const color =
    isCheap ? 'var(--curry-leaf)' : isExpensive ? 'var(--chili-600)' : 'var(--color-text-muted)'
  const arrow = isCheap ? '↘' : isExpensive ? '↗' : '→'
  const direction = isCheap ? 'cheaper than median' : isExpensive ? 'above median' : 'near median'

  return (
    <span
      className="inline-flex items-baseline gap-1 font-mono text-[12px] font-bold"
      style={{ color }}
      aria-label={`${delta.toFixed(1)} percent ${direction}`}
    >
      <span aria-hidden="true">{arrow}</span>
      <span className="num">{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
    </span>
  )
}

export function OfferCard({ offer }: { offer: OfferItem }) {
  const delta = offer.delta_vs_median_pct
  const sourceLabel = SOURCE_LABELS[offer.source] ?? offer.source
  const tilt = SOURCE_TILT[offer.source] ?? -2.5
  const unitLabel = offer.unit_amount ? `${offer.unit_amount} ${offer.unit ?? ''}`.trim() : offer.unit ?? '—'
  const freshnessLabel = offer.last_seen_at ? `Fresh ${formatCompactDate(offer.last_seen_at)}` : 'Freshness pending'

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className={cn(
        'group relative grid min-h-[142px] grid-cols-[112px_minmax(0,1fr)] gap-0 overflow-hidden sm:min-h-[158px] sm:grid-cols-[128px_minmax(0,1fr)]',
        'bg-[color:var(--color-bg-card)] text-[color:var(--color-text-primary)]',
        'border border-[color:var(--color-border)]',
        'transition-colors duration-200 hover:border-[color:var(--color-border-strong)]',
      )}
    >
      {/* Source sticker — top-right, rotated */}
      <div
        className="absolute right-4 top-4 z-20 font-mono text-[9px] font-bold uppercase tracking-[0.22em] sm:text-[10px]"
        style={{ transform: `rotate(${tilt}deg)` }}
      >
        <span className="inline-block bg-[color:var(--ink-900)] px-2 py-0.5 text-[color:var(--paper-100)] shadow-[2px_2px_0_var(--color-border-strong)]">
          {sourceLabel}
        </span>
      </div>

      {/* Thumbnail */}
      <Link
        to={`/offers/${offer.id}`}
        className="relative block aspect-square min-h-[112px] border-r border-[color:var(--color-border)] sm:min-h-[128px]"
        aria-label={`Open ${offer.display_name} detail`}
      >
        <StallThumb src={offer.image_url} alt={offer.display_name} label={sourceLabel} />
      </Link>

      {/* Body */}
      <div className="flex min-w-0 flex-col justify-between gap-3 p-4 pr-5 sm:p-5 sm:pr-5">
        <div className="min-w-0">
          <h3
            className="font-display text-[17px] leading-[1.16] tracking-normal text-[color:var(--color-text-primary)] line-clamp-2 sm:text-[19px]"
            style={{ fontVariationSettings: "'opsz' 36, 'wght' 600" }}
          >
            {offer.display_name}
          </h3>
          <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)] sm:text-[11px]">
            {(offer.brand || 'generic')} <span className="mx-1 opacity-60">·</span> {offer.category}
          </p>
          <p className="mt-1.5 truncate font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-text-faint)] sm:text-[10px]">
            {freshnessLabel}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="num flex items-baseline gap-1 text-[30px] font-bold leading-none tracking-normal text-[color:var(--color-text-primary)] sm:text-[34px]">
              <span className="text-[13px] font-semibold text-[color:var(--color-text-muted)]">රු</span>
              {formatCurrency(offer.price_lkr)}
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <DeltaMark delta={delta} />
              {offer.price_band && (
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-faint)]">
                  · {offer.price_band}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="num font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)] sm:text-[11px]">
              {unitLabel}
            </p>
            <Link
              to={`/offers/${offer.id}`}
              className="mt-2 inline-flex items-center gap-1 font-display text-[13px] italic text-[color:var(--color-text-primary)] underline decoration-1 underline-offset-[5px] transition-colors hover:text-[color:var(--chili-500)] hover:decoration-[color:var(--chili-500)]"
            >
              read
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* dotted baseline */}
      <div className="col-span-2 h-px w-full rule-dotted" aria-hidden="true" />
    </motion.article>
  )
}
