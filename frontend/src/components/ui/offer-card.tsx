import { formatCurrency } from '../../lib/format'
import type { OfferItem } from '../../types'
import { Link } from 'react-router-dom'

export function OfferCard({ offer }: { offer: OfferItem }) {
  const confidenceHint =
    offer.delta_vs_median_pct === null
      ? 'Signal calibrating'
      : Math.abs(offer.delta_vs_median_pct) <= 8
      ? 'High confidence'
      : Math.abs(offer.delta_vs_median_pct) <= 15
      ? 'Medium confidence'
      : 'Lower confidence'

  return (
    <article className="fp-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{offer.source}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{offer.display_name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {offer.brand || 'Generic'} · {offer.category}
          </p>
        </div>
        {offer.price_band ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {offer.price_band}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
        <div>
          <p className="text-sm text-slate-500">Current price</p>
          <p className="text-2xl font-semibold text-slate-950">Rs {formatCurrency(offer.price_lkr)}</p>
        </div>
        <div className="text-right text-sm text-slate-600">
          {offer.unit_amount ? `${offer.unit_amount}${offer.unit || ''}` : 'Unit pending'}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <Link to={`/offers/${offer.id}`} className="fp-button-secondary">
          Open offer
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Source: {offer.source}</span>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{confidenceHint}</span>
      </div>
    </article>
  )
}
