import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { SourcePill } from '../components/primitives/source-pill'
import { OfferCard } from '../components/ui/offer-card'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'

export function RetailPage() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'unit-low' | 'unit-high' | 'price-low' | 'price-high' | 'name'>('unit-low')

  const offersQuery = useQuery({
    queryKey: ['offers', 'retail-page'],
    queryFn: () => api.getOffers('?limit=24'),
  })
  const offers = useMemo(() => offersQuery.data?.items ?? [], [offersQuery.data?.items])
  const sources = useMemo(
    () => Array.from(new Set(offers.map((o) => o.source))).sort(),
    [offers]
  )
  const categories = useMemo(
    () => Array.from(new Set(offers.map((o) => o.category))).sort(),
    [offers],
  )
  const units = useMemo(
    () => Array.from(new Set(offers.map((o) => o.unit).filter(Boolean) as string[])).sort(),
    [offers],
  )
  const visibleOffers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return offers
      .filter((o) => (sourceFilter === 'all' ? true : o.source === sourceFilter))
      .filter((o) => (categoryFilter === 'all' ? true : o.category === categoryFilter))
      .filter((o) => (unitFilter === 'all' ? true : o.unit === unitFilter))
      .filter((o) => {
        if (!needle) return true
        return [o.display_name, o.canonical_name, o.brand, o.category, o.source]
          .filter(Boolean).join(' ').toLowerCase().includes(needle)
      })
      .sort((a, b) => {
        const aUnit = a.price_per_unit_lkr ?? a.price_lkr
        const bUnit = b.price_per_unit_lkr ?? b.price_lkr
        if (sortBy === 'unit-high') return bUnit - aUnit
        if (sortBy === 'unit-low') return aUnit - bUnit
        if (sortBy === 'price-high') return b.price_lkr - a.price_lkr
        if (sortBy === 'name') return a.display_name.localeCompare(b.display_name)
        return a.price_lkr - b.price_lkr
      })
  }, [categoryFilter, offers, search, sortBy, sourceFilter, unitFilter])

  return (
    <section className="space-y-10">
      <SectionHeader
        eyebrow="Retail Floor"
        title="Retail price board"
        description="Every supermarket offer is normalized to a comparable unit, stamped with source, category, and delta from the seven-day median."
      />

      {offersQuery.isError && (
        <ErrorState
          title="Retail floor went dark"
          message="Retail offers could not be loaded right now."
          helper="You can continue with public-market discovery while this source reconnects."
          onRetry={() => offersQuery.refetch()}
          links={[{ label: 'Open markets', to: '/markets' }, { label: 'Open compare', to: '/compare' }]}
        />
      )}

      {/* — Source bar — */}
      <div className="flex flex-wrap items-center gap-2 border-y-2 border-[color:var(--color-text-primary)] bg-[color:var(--color-bg-card)] px-4 py-3">
        <span className="text-kicker mr-2">§ Source</span>
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

      {/* — Toolbar — */}
      <div className="grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 md:grid-cols-2 lg:grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr_0.9fr]">
        <label className="space-y-2">
          <span className="text-kicker">Search the floor</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="fp-input pl-10"
              placeholder="Item, brand, source, category…"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Category</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="fp-select">
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Source</span>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="fp-select">
            <option value="all">All sources</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Unit</span>
          <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="fp-select">
            <option value="all">All units</option>
            {units.map((unit) => <option key={unit} value={unit}>per {unit}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Order by</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
            <option value="unit-low">Unit price low to high</option>
            <option value="unit-high">Unit price high to low</option>
            <option value="price-low">Price ↗ low to high</option>
            <option value="price-high">Price ↘ high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      {/* — Meter strip — */}
      <div className="grid grid-cols-3 gap-[1px] bg-[color:var(--color-border)]">
        {[
          { label: 'Stalls visible', value: visibleOffers.length },
          { label: 'Sources in view', value: new Set(visibleOffers.map((o) => o.source)).size || 0 },
          { label: 'Catalog size', value: offersQuery.data?.total ?? offers.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[color:var(--color-bg-card)] px-5 py-4">
            <p className="text-kicker">{label}</p>
            <p className="num mt-2 text-[28px] font-bold leading-none tracking-[-0.025em] text-[color:var(--color-text-primary)]">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* — Results — */}
      {offersQuery.isLoading ? (
        <SectionSkeleton cards={6} />
      ) : !visibleOffers.length ? (
        <EmptyState
          title="No stalls match this filter"
          description="Adjust your search, reset source filters, or switch discovery surfaces."
          hint="Next action: try wet markets or compare."
          actionLabel="Open markets"
          actionTo="/markets"
          secondaryActionLabel="Open compare"
          secondaryActionTo="/compare"
        />
      ) : (
        <div className="grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
          {visibleOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      <NextActionLinks
        title="Next column"
        links={[
          { label: 'Compare districts', to: '/compare' },
          { label: 'Build basket', to: '/basket' },
          { label: 'Open intelligence', to: '/intelligence' },
        ]}
      />
    </section>
  )
}
