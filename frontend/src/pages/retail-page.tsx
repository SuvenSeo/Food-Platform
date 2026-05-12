import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { OfferCard } from '../components/ui/offer-card'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'

export function RetailPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low')
  const offersQuery = useQuery({
    queryKey: ['offers', 'retail-page'],
    queryFn: () => api.getOffers('?limit=12'),
  })
  const offers = useMemo(() => offersQuery.data?.items ?? [], [offersQuery.data?.items])
  const sources = useMemo(() => Array.from(new Set(offers.map((offer) => offer.source))).sort(), [offers])
  const visibleOffers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return offers
      .filter((offer) => (sourceFilter === 'all' ? true : offer.source === sourceFilter))
      .filter((offer) => {
        if (!needle) return true
        return [offer.display_name, offer.canonical_name, offer.brand, offer.category, offer.source]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(needle)
      })
      .sort((left, right) => {
        if (sortBy === 'price-high') return right.price_lkr - left.price_lkr
        if (sortBy === 'name') return left.display_name.localeCompare(right.display_name)
        return left.price_lkr - right.price_lkr
      })
  }, [offers, search, sortBy, sourceFilter])

  const isLoading = offersQuery.isLoading

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Discovery"
        title="Supermarket and grocery intelligence"
        description="Discovery surface for active retail offers with source provenance and value confidence hints."
      />
      {offersQuery.isError ? (
        <ErrorState
          title="Retail discovery feed unavailable"
          message="Retail offers could not be loaded right now."
          helper="You can continue with public-market discovery while this source reconnects."
          onRetry={() => offersQuery.refetch()}
          links={[
            { label: 'Open markets', to: '/markets' },
            { label: 'Open compare', to: '/compare' },
          ]}
        />
      ) : null}
      <div className="fp-panel space-y-6">
        <div className="fp-toolbar">
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>Search offers</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="fp-input"
              placeholder="Search by item, brand, source, or category"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Source</span>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="fp-select">
              <option value="all">All sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="fp-select">
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <article className="fp-kpi">
            <p className="text-sm text-slate-500">Visible offers</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{visibleOffers.length}</p>
          </article>
          <article className="fp-kpi">
            <p className="text-sm text-slate-500">Sources in view</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {new Set(visibleOffers.map((item) => item.source)).size || 0}
            </p>
          </article>
          <article className="fp-kpi">
            <p className="text-sm text-slate-500">Catalog size</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{offersQuery.data?.total ?? offers.length}</p>
          </article>
        </div>

        {isLoading ? (
          <SectionSkeleton cards={4} />
        ) : !visibleOffers.length ? (
          <EmptyState
            title="No retail offers match these filters"
            description="Adjust your search, reset source filters, or switch discovery surfaces."
            hint="Next action: continue in markets or compare."
            actionLabel="Open markets discovery"
            actionTo="/markets"
            secondaryActionLabel="Open compare"
            secondaryActionTo="/compare"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}

        <NextActionLinks
          title="Next actions"
          links={[
            { label: 'Compare districts', to: '/compare' },
            { label: 'Build basket', to: '/basket' },
            { label: 'Review watchlists', to: '/watchlists' },
          ]}
        />
      </div>
    </section>
  )
}
