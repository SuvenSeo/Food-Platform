import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function ComparePage() {
  const marketsQuery = useQuery({
    queryKey: ['market-quotes'],
    queryFn: () => api.getMarketQuotes(),
  })
  const [leftDistrict, setLeftDistrict] = useState('Colombo')
  const [rightDistrict, setRightDistrict] = useState('Kandy')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'delta-high' | 'delta-low' | 'item'>('delta-high')
  const compareQuery = useQuery({
    queryKey: ['district-compare', leftDistrict, rightDistrict],
    queryFn: () => api.getDistrictCompare(leftDistrict, rightDistrict),
    enabled: Boolean(leftDistrict && rightDistrict),
  })
  const { saveEntry } = useWatchlists()

  const districts = useMemo(
    () => Array.from(new Set((marketsQuery.data?.items ?? []).map((item) => item.district))).sort(),
    [marketsQuery.data?.items],
  )
  const districtOptions = districts.length > 0 ? districts : [leftDistrict, rightDistrict]
  const data = compareQuery.data
  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.items ?? [])
      .filter((item) => `${item.item_name} ${item.category}`.toLowerCase().includes(needle))
      .sort((left, right) => {
        const leftDelta = Math.abs(left.delta_lkr)
        const rightDelta = Math.abs(right.delta_lkr)
        if (sortBy === 'item') return left.item_name.localeCompare(right.item_name)
        if (sortBy === 'delta-low') return leftDelta - rightDelta
        return rightDelta - leftDelta
      })
  }, [data?.items, search, sortBy])

  const isLoading = compareQuery.isLoading || marketsQuery.isLoading

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Discovery"
        title="Compare stores, districts, and food clusters"
        description="Comparison workspace between discovery and intelligence: district deltas with continuity into watchlists and basket plans."
      />
      {marketsQuery.isError || compareQuery.isError ? (
        <ErrorState
          title="Compare surface unavailable"
          message="District comparison data could not be loaded."
          helper="Keep exploring with retail and markets pages while compare signals recover."
          onRetry={() => {
            void marketsQuery.refetch()
            void compareQuery.refetch()
          }}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open markets discovery', to: '/markets' },
          ]}
        />
      ) : null}

      <div className="fp-panel space-y-6">
        <div className="grid gap-3 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr_auto_1fr]">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Left district</span>
            <select
              aria-label="Left district"
              value={leftDistrict}
              onChange={(event) => setLeftDistrict(event.target.value)}
              className="fp-select"
            >
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setLeftDistrict(rightDistrict)
              setRightDistrict(leftDistrict)
            }}
            className="fp-button-secondary self-end"
          >
            Swap
          </button>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Right district</span>
            <select
              aria-label="Right district"
              value={rightDistrict}
              onChange={(event) => setRightDistrict(event.target.value)}
              className="fp-select"
            >
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-slate-950">
            {data?.left} vs {data?.right}
          </h3>
          <button
            type="button"
            onClick={() =>
              saveEntry({
                id: `compare-${data?.left}-${data?.right}`,
                title: `${data?.left} vs ${data?.right}`,
                kind: 'compare',
                href: '/compare',
                summary: `${data?.items.length ?? 0} shared produce items`,
              })
            }
            className="fp-button-primary"
          >
            Save compare view
          </button>
        </div>

        <div className="fp-toolbar md:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.4fr_1fr]">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Search compared items</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="fp-input"
              placeholder="Tomato, onion, leafy greens..."
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="fp-select">
              <option value="delta-high">Largest delta first</option>
              <option value="delta-low">Smallest delta first</option>
              <option value="item">Item name A-Z</option>
            </select>
          </label>
        </div>

        <div className="mt-6 space-y-4">
          {isLoading ? <SectionSkeleton cards={4} /> : null}
          {!isLoading && !visibleItems.length ? (
            <EmptyState
              title="No overlapping produce items found"
              description="Try a different district pair or continue through adjacent discovery flows."
              hint="Next action: continue in markets or categories."
              actionLabel="Open categories"
              actionTo="/categories"
              secondaryActionLabel="Open markets discovery"
              secondaryActionTo="/markets"
            />
          ) : null}
          {visibleItems.map((item) => (
            <article key={item.item_name} className="fp-soft-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">{item.item_name}</h4>
                  <p className="text-sm text-slate-600 capitalize">{item.category}</p>
                </div>
                <p className="text-sm font-medium text-emerald-700">
                  {item.cheaper_side} cheaper by Rs {formatCurrency(Math.abs(item.delta_lkr))}
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">{data?.left}</p>
                  <p>Rs {formatCurrency(item.left_price_lkr)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">{data?.right}</p>
                  <p>Rs {formatCurrency(item.right_price_lkr)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">Provenance: shared item cluster</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Confidence: paired district quotes</span>
              </div>
            </article>
          ))}
        </div>

        <NextActionLinks
          title="Next actions"
          links={[
            { label: 'Build basket', to: '/basket' },
            { label: 'Review watchlists', to: '/watchlists' },
            { label: 'Open markets', to: '/markets' },
          ]}
        />
      </div>
    </section>
  )
}
