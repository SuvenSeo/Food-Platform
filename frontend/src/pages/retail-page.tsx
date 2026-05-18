import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { Panel } from '../components/primitives/panel'
import { SourcePill } from '../components/primitives/source-pill'
import { OfferCard } from '../components/ui/offer-card'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
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
  const sources = useMemo(
    () => Array.from(new Set(offers.map((o) => o.source))).sort(),
    [offers]
  )
  const visibleOffers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return offers
      .filter((o) => (sourceFilter === 'all' ? true : o.source === sourceFilter))
      .filter((o) => {
        if (!needle) return true
        return [o.display_name, o.canonical_name, o.brand, o.category, o.source]
          .filter(Boolean).join(' ').toLowerCase().includes(needle)
      })
      .sort((a, b) => {
        if (sortBy === 'price-high') return b.price_lkr - a.price_lkr
        if (sortBy === 'name') return a.display_name.localeCompare(b.display_name)
        return a.price_lkr - b.price_lkr
      })
  }, [offers, search, sortBy, sourceFilter])

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Discovery"
        title="Supermarket and grocery intelligence"
        description="Discovery surface for active retail offers with source provenance and value confidence hints."
      />

      {offersQuery.isError && (
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
      )}

      <Panel className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <SourcePill source="all" active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')} count={offers.length} />
          {sources.map((s) => (
            <SourcePill
              key={s}
              source={s}
              active={sourceFilter === s}
              onClick={() => setSourceFilter(s)}
              count={offers.filter((o) => o.source === s).length}
            />
          ))}
        </div>
        <div className="fp-toolbar">
          <label className="space-y-2 md:col-span-2">
            <span className="eyebrow-label">Search offers</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="Search by item, brand, source, or category"
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Source</span>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="fp-select">
              <option value="all">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
              <option value="price-low">Price: low → high</option>
              <option value="price-high">Price: high → low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>
        </div>

        {/* Meta strip */}
        <div className="hairline-grid rounded-lg overflow-hidden grid-cols-3">
          {[
            { label: 'Visible offers', value: visibleOffers.length },
            { label: 'Sources in view', value: new Set(visibleOffers.map((o) => o.source)).size || 0 },
            { label: 'Catalog size', value: offersQuery.data?.total ?? offers.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0a0a0a] px-4 py-3">
              <p className="eyebrow-label">{label}</p>
              <p className="num mt-1.5 text-xl font-semibold text-[#f5f5f5]">{value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Results */}
        <RevealSection>
          {offersQuery.isLoading ? (
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
        </RevealSection>

        <NextActionLinks
          title="Next actions"
          links={[
            { label: 'Compare districts', to: '/compare' },
            { label: 'Build basket', to: '/basket' },
            { label: 'Review watchlists', to: '/watchlists' },
          ]}
        />
      </Panel>
    </section>
  )
}
