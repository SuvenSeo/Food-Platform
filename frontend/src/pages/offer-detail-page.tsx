import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'
import { ApiError, api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function OfferDetailPage() {
  const { offerId } = useParams()
  const { saveEntry } = useWatchlists()
  const offerQuery = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => api.getOffer(offerId || ''),
    enabled: Boolean(offerId),
  })
  const relatedQuery = useQuery({
    queryKey: ['related-offers', offerQuery.data?.category],
    queryFn: () => api.getOffers(`?category=${encodeURIComponent(offerQuery.data?.category || '')}`),
    enabled: Boolean(offerQuery.data?.category),
  })

  if (offerQuery.isLoading) {
    return <LoadingBlock />
  }

  if (offerQuery.isError) {
    const isNotFound = offerQuery.error instanceof ApiError && offerQuery.error.status === 404
    if (isNotFound) {
      return (
        <div className="fp-panel">
          <EmptyState
            title="Offer not found"
            description="This offer may have expired. Return to retail and continue from a live listing."
            actionLabel="Back to retail"
            actionTo="/retail"
          />
        </div>
      )
    }
    return <ErrorState message="Unable to load this offer right now." onRetry={() => offerQuery.refetch()} />
  }

  if (!offerQuery.data) {
    return (
      <div className="fp-panel">
        <EmptyState title="Offer not found" description="Return to retail and choose another offer." actionLabel="Back to retail" actionTo="/retail" />
      </div>
    )
  }

  const offer = offerQuery.data
  const relatedOffers = (relatedQuery.data?.items ?? []).filter((item) => item.id !== offer.id).slice(0, 3)

  return (
    <section className="fp-panel space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/retail" className="fp-button-secondary">
          Back to retail
        </Link>
        <Link to="/compare" className="fp-button-secondary">
          Compare districts
        </Link>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader
          eyebrow={offer.source}
          title={offer.display_name}
          description="Review this offer with context and continue into compare, basket, or watchlist workflows."
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              saveEntry({
                id: `offer-${offer.id}`,
                title: offer.display_name,
                kind: 'offer',
                href: `/offers/${offer.id}`,
                summary: `Rs ${formatCurrency(offer.price_lkr)} · ${offer.price_band || 'pending signal'}`,
              })
            }
            className="fp-button-primary"
          >
            Save offer
          </button>
          <a
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className="fp-button-secondary"
          >
            Visit source
          </a>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="fp-kpi">
          <p className="text-sm text-slate-500">Current price</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">Rs {formatCurrency(offer.price_lkr)}</p>
        </div>
        <div className="fp-kpi">
          <p className="text-sm text-slate-500">Price band</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{offer.price_band || 'Pending'}</p>
        </div>
        <div className="fp-kpi">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Brand</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{offer.brand || 'Unspecified'}</p>
        </div>
        <div className="fp-kpi">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Unit</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {offer.unit_amount ? `${offer.unit_amount} ${offer.unit || ''}` : offer.unit || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="fp-soft-card">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Per unit</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {offer.price_per_unit_lkr ? `Rs ${formatCurrency(offer.price_per_unit_lkr)}` : 'N/A'}
          </p>
        </div>
        <div className="fp-soft-card">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Median delta</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">
            {offer.delta_vs_median_pct == null ? 'Pending' : `${offer.delta_vs_median_pct.toFixed(2)}%`}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-700">Decision support</p>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          This offer is normalized into a comparable cluster so the platform can score it against nearby market signals rather than showing a raw product card in isolation.
        </p>
      </div>

      <NextActionLinks
        title="Next actions"
        links={[
          { label: 'Build basket', to: '/basket' },
          { label: 'Review watchlists', to: '/watchlists' },
          { label: 'Open categories', to: '/categories' },
        ]}
      />

      <div className="space-y-4">
        <SectionHeader
          eyebrow="Related"
          title="Similar offers"
          description="Nearby retail alternatives help this page feel like a workflow, not a dead end."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {relatedOffers.map((item) => (
            <Link key={item.id} to={`/offers/${item.id}`} className="fp-card">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.source}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.display_name}</h3>
              <p className="mt-2 text-sm text-slate-600">Rs {formatCurrency(item.price_lkr)}</p>
            </Link>
          ))}
          {!relatedOffers.length ? (
            <EmptyState
              title="No related offers yet"
              description="Explore category summaries and markets to continue price discovery."
              actionLabel="Open categories"
              actionTo="/categories"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
