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
  const PAGE_SIZE = 48
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'unit-low' | 'unit-high' | 'price-low' | 'price-high' | 'name'>('unit-low')
  const [page, setPage] = useState(1)

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String((page - 1) * PAGE_SIZE),
      sort_by: sortBy,
    })
    if (search.trim()) params.set('search', search.trim())
    if (sourceFilter !== 'all') params.set('source', sourceFilter)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    if (unitFilter !== 'all') params.set('unit', unitFilter)
    return `?${params.toString()}`
  }, [categoryFilter, page, search, sortBy, sourceFilter, unitFilter])

  const offersQuery = useQuery({
    queryKey: ['offers', 'retail-page', queryString],
    queryFn: () => api.getOffers(queryString),
  })
  const offers = useMemo(() => offersQuery.data?.items ?? [], [offersQuery.data?.items])
  const facets = offersQuery.data?.facets
  const sources = useMemo(
    () => facets?.sources ?? Array.from(new Set(offers.map((o) => o.source))).sort().map((source) => ({ value: source, label: source, count: offers.filter((o) => o.source === source).length })),
    [facets?.sources, offers]
  )
  const categories = useMemo(
    () => facets?.categories ?? Array.from(new Set(offers.map((o) => o.category))).sort().map((category) => ({ value: category, label: category, count: offers.filter((o) => o.category === category).length })),
    [facets?.categories, offers],
  )
  const units = useMemo(
    () => facets?.units ?? Array.from(new Set(offers.map((o) => o.unit).filter(Boolean) as string[])).sort().map((unit) => ({ value: unit, label: unit, count: offers.filter((o) => o.unit === unit).length })),
    [facets?.units, offers],
  )
  const total = offersQuery.data?.total ?? offers.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const chooseSource = (source: string) => {
    setSourceFilter(source)
    setPage(1)
  }
  const chooseCategory = (category: string) => {
    setCategoryFilter(category)
    setPage(1)
  }
  const chooseUnit = (unit: string) => {
    setUnitFilter(unit)
    setPage(1)
  }
  const chooseSort = (sort: typeof sortBy) => {
    setSortBy(sort)
    setPage(1)
  }
  const searchFloor = (value: string) => {
    setSearch(value)
    setPage(1)
  }

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
        <SourcePill source="all" active={sourceFilter === 'all'} onClick={() => chooseSource('all')} count={facets?.sources.reduce((sum, item) => sum + item.count, 0) ?? total} />
        {sources.map((s) => (
          <SourcePill
            key={s.value}
            source={s.label}
            active={sourceFilter === s.value}
            onClick={() => chooseSource(s.value)}
            count={s.count}
          />
        ))}
      </div>
      <div className="rounded-card border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] px-4 py-3 text-sm text-[color:var(--color-text-secondary)]">
        Showing {offers.length.toLocaleString()} of {total.toLocaleString()} scraped retail offers. Source filters are built from the full catalog, not just the current page.
      </div>

      {/* — Toolbar — */}
      <div className="grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 md:grid-cols-2 lg:grid-cols-[1.6fr_0.9fr_0.9fr_0.8fr_0.9fr]">
        <label className="space-y-2">
          <span className="text-kicker">Search the floor</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => searchFloor(e.target.value)}
              className="fp-input pl-10"
              placeholder="Item, brand, source, category…"
            />
          </div>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Category</span>
          <select value={categoryFilter} onChange={(e) => chooseCategory(e.target.value)} className="fp-select">
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.value} value={category.value}>{category.label} ({category.count})</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Source</span>
          <select value={sourceFilter} onChange={(e) => chooseSource(e.target.value)} className="fp-select">
            <option value="all">All sources</option>
            {sources.map((s) => <option key={s.value} value={s.value}>{s.label} ({s.count})</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Unit</span>
          <select value={unitFilter} onChange={(e) => chooseUnit(e.target.value)} className="fp-select">
            <option value="all">All units</option>
            {units.map((unit) => <option key={unit.value} value={unit.value}>per {unit.label} ({unit.count})</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Order by</span>
          <select value={sortBy} onChange={(e) => chooseSort(e.target.value as typeof sortBy)} className="fp-select">
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
          { label: 'Stalls visible', value: offers.length },
          { label: 'Sources in catalog', value: sources.length || 0 },
          { label: 'Catalog size', value: total },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[color:var(--color-bg-card)] px-5 py-4">
            <p className="text-kicker">{label}</p>
            <p className="num mt-2 text-[28px] font-bold leading-none tracking-normal text-[color:var(--color-text-primary)]">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* — Results — */}
      {offersQuery.isLoading ? (
        <SectionSkeleton cards={6} />
      ) : !offers.length ? (
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
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[color:var(--color-border)] py-4">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            Page {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="fp-button-secondary"
              disabled={page === 1 || offersQuery.isFetching}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="fp-button-primary"
              disabled={page >= totalPages || offersQuery.isFetching}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next page
            </button>
          </div>
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
