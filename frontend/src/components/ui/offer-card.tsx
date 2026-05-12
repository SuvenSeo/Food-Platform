import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'

import { formatCurrency } from '../../lib/format'
import type { OfferItem } from '../../types'
import { Badge } from './badge'

export function OfferCard({ offer }: { offer: OfferItem }) {
  const delta = offer.delta_vs_median_pct
  const confidenceVariant =
    delta === null ? 'neutral' : Math.abs(delta) <= 8 ? 'green' : Math.abs(delta) <= 15 ? 'amber' : 'red'
  const confidenceLabel =
    delta === null ? 'Calibrating' : Math.abs(delta) <= 8 ? 'High confidence' : Math.abs(delta) <= 15 ? 'Medium' : 'Low confidence'

  const isCheap = delta !== null && delta < -5
  const isExpensive = delta !== null && delta > 5

  return (
    <motion.article
      className="premium-card overflow-hidden"
      whileHover={{ y: -3, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow-label">{offer.source}</p>
            <h3 className="mt-2 text-base font-semibold leading-snug tracking-tight text-[#f5f5f5]">
              {offer.display_name}
            </h3>
            <p className="mt-1 text-sm text-[#737373]">
              {offer.brand || 'Generic'} · {offer.category}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {offer.price_band && (
              <Badge variant="green">{offer.price_band}</Badge>
            )}
            <Badge variant={confidenceVariant}>{confidenceLabel}</Badge>
          </div>
        </div>

        {/* Price strip */}
        <div
          className="mt-5 flex items-end justify-between gap-4 border-t pt-4"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <div>
            <p className="text-xs text-[#737373] mb-1">Current price</p>
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
                    <TrendingDown className="h-3 w-3" />
                  ) : isExpensive ? (
                    <TrendingUp className="h-3 w-3" />
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
        <p className="text-xs text-[#404040] font-mono">{offer.source}</p>
        <Link
          to={`/offers/${offer.id}`}
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors hover:text-orange-300 hover:bg-orange-500/10"
        >
          View offer
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  )
}
