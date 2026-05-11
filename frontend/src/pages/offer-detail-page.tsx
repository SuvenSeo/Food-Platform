import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function OfferDetailPage() {
  const { offerId } = useParams()
  const offerQuery = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => api.getOffer(offerId || ''),
    enabled: Boolean(offerId),
  })

  if (offerQuery.isLoading) {
    return <LoadingBlock />
  }

  if (!offerQuery.data) {
    return <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">Offer not found.</div>
  }

  const offer = offerQuery.data

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
      <Link to="/retail" className="text-sm font-semibold text-orange-700">
        Back to retail
      </Link>
      <SectionHeader eyebrow={offer.source} title={offer.display_name} description="A richer detail surface for normalized offer intelligence." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Current price</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">Rs {formatCurrency(offer.price_lkr)}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Price band</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{offer.price_band || 'Pending'}</p>
        </div>
      </div>
    </section>
  )
}
