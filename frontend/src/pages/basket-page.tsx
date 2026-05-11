import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function BasketPage() {
  const [preset, setPreset] = useState('essentials')
  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'missing'>('all')
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low')
  const basketQuery = useQuery({
    queryKey: ['basket-estimate', preset],
    queryFn: () => api.getBasketEstimate(preset),
  })
  const { saveEntry } = useWatchlists()
  const data = basketQuery.data
  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.items ?? [])
      .filter((item) => {
        if (availabilityFilter === 'available') return item.price_lkr !== null
        if (availabilityFilter === 'missing') return item.price_lkr === null
        return true
      })
      .filter((item) => `${item.label} ${item.source || ''}`.toLowerCase().includes(needle))
      .sort((left, right) => {
        if (sortBy === 'name') return left.label.localeCompare(right.label)
        const leftPrice = left.price_lkr ?? Number.POSITIVE_INFINITY
        const rightPrice = right.price_lkr ?? Number.POSITIVE_INFINITY
        if (sortBy === 'price-high') return rightPrice - leftPrice
        return leftPrice - rightPrice
      })
  }, [availabilityFilter, data?.items, search, sortBy])

  if (basketQuery.isLoading) {
    return <LoadingBlock />
  }

  if (basketQuery.isError) {
    return <ErrorState message="Basket estimates are currently unavailable." onRetry={() => basketQuery.refetch()} />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Basket"
        title="Basket workspace"
        description="Estimate household totals, isolate missing items, and save reusable baskets for recurring shopping decisions."
      />
      <div className="fp-panel space-y-6 border-orange-100 bg-orange-50">
        <div className="fp-toolbar lg:grid-cols-4">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Basket preset</span>
            <select aria-label="Basket preset" value={preset} onChange={(event) => setPreset(event.target.value)} className="fp-select">
              {data?.available_presets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Search items</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="fp-input"
              placeholder="oil, tomato, rice..."
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Availability</span>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value as typeof availabilityFilter)}
              className="fp-select"
            >
              <option value="all">All items</option>
              <option value="available">Available only</option>
              <option value="missing">Missing only</option>
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

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{data?.preset.label}</h3>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Estimated from the cheapest currently available retail and market signals in the selected preset basket.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              saveEntry({
                id: `basket-${data?.preset.id}`,
                title: data?.preset.label ?? 'Basket preset',
                kind: 'basket',
                href: `/basket?preset=${data?.preset.id}`,
                summary: `${data?.summary.available_items} items · Rs ${formatCurrency(data?.summary.total_lkr ?? 0)}`,
              })
            }
            className="fp-button-primary"
          >
            Save preset to watchlists
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
          <div className="fp-kpi">
            <p className="text-sm text-slate-500">Estimated total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">Rs {formatCurrency(data?.summary.total_lkr ?? 0)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {data?.summary.available_items} available items · {data?.summary.missing_items} missing
            </p>
          </div>

          <div className="space-y-3">
            {!visibleItems.length ? (
              <EmptyState
                title="No basket items match this filter"
                description="Try broader filters or switch presets to continue your basket analysis."
                actionLabel="Open markets"
                actionTo="/markets"
              />
            ) : (
              visibleItems.map((item) => (
                <article key={item.label} className="fp-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{item.label}</h4>
                      <p className="text-sm text-slate-600">{item.source || 'Unavailable'}</p>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">
                      {item.price_lkr === null ? 'N/A' : `Rs ${formatCurrency(item.price_lkr)}`}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <NextActionLinks
          title="Next actions"
          links={[
            { label: 'Compare districts', to: '/compare' },
            { label: 'Retail offers', to: '/retail' },
            { label: 'Review watchlists', to: '/watchlists' },
          ]}
        />
      </div>
    </section>
  )
}
