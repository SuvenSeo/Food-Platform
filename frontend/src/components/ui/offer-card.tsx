import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingDown, TrendingUp, ImageOff } from 'lucide-react'

import { formatCurrency } from '../../lib/format'
import type { OfferItem } from '../../types'
import { Badge } from './badge'

const SOURCE_LABELS: Record<string, string> = {
  spar2u: 'Spar',
  glomark: 'Glomark',
  keells: 'Keells',
  cargills: 'Cargills',
}

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#161616]">
        <ImageOff className="h-6 w-6 text-[#404040]" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
    />
  )
}

export function OfferCard({ offer }: { offer: OfferItem }) {
  const delta = offer.delta_vs_median_pct
  const confidenceVariant =
    delta === null ? 'neutral' : Math.abs(delta) <= 8 ? 'green' : Math.abs(delta) <= 15 ? 'amber' : 'red'
  const confidenceLabel =
    delta === null ? 'Calibrating' : Math.abs(delta) <= 8 ? 'High confidence' : Math.abs(delta) <= 15 ? 'Medium' : 'Low confidence'

  const isCheap = delta !== null && delta < -5
  const isExpensive = delta !== null && delta > 5
  const hasImage = Boolean(offer.image_url)
  const sourceLabel = SOURCE_LABELS[offer.source] ?? offer.source

  return (
    <motion.article
      className="premium-card group overflow-hidden"
      whileHover={{ y: -3, transition: { duration: 0.15, ease: 'easeOut' } }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Product image strip — only when image is available */}
      {hasImage && (
        <div
          className="relative h-40 w-full overflow-hidden border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0d0d0d' }}
        >
          <ProductImage src={offer.image_url!} alt={offer.display_name} />
          {/* Source badge overlaid on image */}
          <div className="absolute bottom-2 left-3">
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a3a3a3] backdrop-blur-sm">
              {sourceLabel}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {!hasImage && (
              <p className="eyebrow-label mb-1.5">{sourceLabel}</p>
            )}
            <h3 className="text-base font-semibold leading-snug tracking-tight text-[#f5f5f5]">
              {offer.display_name}
            </h3>
            <p className="mt-0.5 text-sm text-[#737373]">
              {offer.brand || 'Generic'} · {offer.category}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {offer.price_band && (
              <Badge variant="green">{offer.price_band}</Badge>
            )}
            <Badge variant={confidenceVariant}>{confidenceLabel}</Badge>
          </div>
        </div>

        {/* Price strip */}
        <div
          className="mt-4 flex items-end justify-between gap-4 border-t pt-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div>
            <p className="mb-1 text-xs text-[#737373]">Current price</p>
            <div className="flex items-baseline gap-2">
              <p className="num text-2xl font-semibold text-[#f5f5f5]">
                Rs {formatCurrency(offer.price_lkr)}
              </p>
              {delta !== null && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold num ${
                    isCheap ? 'text-emerald-400' : isExpensive ? 'text-red-400' : 'text-[#737373]'
                  }`}
                >
                  {isCheap ? (
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  ) : isExpensive ? (
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  ) : null}
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          <p className="text-right text-sm text-[#737373]">
            {offer.unit_amount ? `${offer.unit_amount}${offer.unit || ''}` : '—'}
          </p>
        </div>
      </div>

      {/* Footer action */}
      <div
        className="flex items-center justify-between px-5 py-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}
      >
        <p className="font-mono text-xs text-[#404040]">{sourceLabel}</p>
        <Link
          to={`/offers/${offer.id}`}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
        >
          View offer
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </motion.article>
  )
}
