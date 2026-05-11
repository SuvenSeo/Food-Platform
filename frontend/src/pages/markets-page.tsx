import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function MarketsPage() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'district'>('price-low')
  const marketQuotesQuery = useQuery({
    queryKey: ['market-quotes', 'markets-page'],
    queryFn: () => api.getMarketQuotes('?limit=12'),
  })
  const quotes = useMemo(() => marketQuotesQuery.data?.items ?? [], [marketQuotesQuery.data?.items])
  const districts = useMemo(() => Array.from(new Set(quotes.map((quote) => quote.district))).sort(), [quotes])
  const categories = useMemo(() => Array.from(new Set(quotes.map((quote) => quote.category))).sort(), [quotes])
  const visibleQuotes = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return quotes
      .filter((quote) => (districtFilter === 'all' ? true : quote.district === districtFilter))
      .filter((quote) => (categoryFilter === 'all' ? true : quote.category === categoryFilter))
      .filter((quote) => {
        if (!needle) return true
        return [quote.item_name, quote.market_name, quote.district, quote.category].join(' ').toLowerCase().includes(needle)
      })
      .sort((left, right) => {
        if (sortBy === 'price-high') return right.price_lkr - left.price_lkr
        if (sortBy === 'district') return left.district.localeCompare(right.district)
        return left.price_lkr - right.price_lkr
      })
  }, [categoryFilter, districtFilter, quotes, search, sortBy])

  if (marketQuotesQuery.isLoading) {
    return <LoadingBlock />
  }

  if (marketQuotesQuery.isError) {
    return <ErrorState message="Market quotes could not be loaded." onRetry={() => marketQuotesQuery.refetch()} />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Markets"
        title="Wet-market quotes"
        description="Filter by district and category, then sort by price to quickly spot where household staples are cheaper."
      />
      <div className="fp-panel space-y-6">
        <div className="fp-toolbar">
          <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
            <span>Search item or market</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="fp-input"
              placeholder="Tomato, Pettah, Colombo..."
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>District</span>
            <select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value)} className="fp-select">
              <option value="all">All districts</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Category</span>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="fp-select">
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700 lg:col-span-2">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="fp-select">
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="district">District: A-Z</option>
            </select>
          </label>
        </div>

        {!visibleQuotes.length ? (
          <EmptyState
            title="No market quotes found"
            description="Try broader filters or move to retail offers to continue your pricing workflow."
            actionLabel="Open retail"
            actionTo="/retail"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleQuotes.map((quote) => (
              <article key={quote.id} className="fp-card">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{quote.district}</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{quote.market_name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-900">{quote.item_name}</p>
                <p className="text-sm text-slate-600">{quote.category}</p>
                <p className="mt-4 text-2xl font-semibold text-slate-950">Rs {formatCurrency(quote.price_lkr)}</p>
                <p className="text-sm text-slate-500">per {quote.unit}</p>
              </article>
            ))}
          </div>
        )}

        <NextActionLinks
          title="Next actions"
          links={[
            { label: 'Compare districts', to: '/compare' },
            { label: 'Category overview', to: '/categories' },
            { label: 'Build basket', to: '/basket' },
          ]}
        />
      </div>
    </section>
  )
}
