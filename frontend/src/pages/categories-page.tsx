import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function CategoriesPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'coverage' | 'retail' | 'market' | 'name'>('coverage')
  const categoriesQuery = useQuery({
    queryKey: ['categories-summary'],
    queryFn: api.getCategoriesSummary,
  })
  const categories = useMemo(() => categoriesQuery.data?.items ?? [], [categoriesQuery.data?.items])
  const visibleCategories = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return categories
      .filter((category) => category.category.toLowerCase().includes(needle))
      .sort((left, right) => {
        const leftCoverage = left.retail_offers_count + left.market_quotes_count
        const rightCoverage = right.retail_offers_count + right.market_quotes_count
        if (sortBy === 'retail') return right.retail_offers_count - left.retail_offers_count
        if (sortBy === 'market') return right.market_quotes_count - left.market_quotes_count
        if (sortBy === 'name') return left.category.localeCompare(right.category)
        return rightCoverage - leftCoverage
      })
  }, [categories, search, sortBy])

  if (categoriesQuery.isLoading) {
    return <LoadingBlock />
  }

  if (categoriesQuery.isError) {
    return <ErrorState message="Category summaries are not available." onRetry={() => categoriesQuery.refetch()} />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Categories"
        title="Category intelligence"
        description="Rank category depth across retail and wet-market sources to pick the best path for deeper analysis."
      />
      <div className="fp-panel space-y-6">
        <div className="fp-toolbar md:grid-cols-[1.3fr_1fr] lg:grid-cols-[1.3fr_1fr]">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Search category</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="fp-input"
              placeholder="grocery, vegetables, dairy..."
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Sort</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="fp-select">
              <option value="coverage">Coverage: highest first</option>
              <option value="retail">Retail depth</option>
              <option value="market">Market depth</option>
              <option value="name">Name: A-Z</option>
            </select>
          </label>
        </div>

        {!visibleCategories.length ? (
          <EmptyState
            title="No categories match your search"
            description="Try a broader query or open markets to continue from district-level data."
            actionLabel="Open markets"
            actionTo="/markets"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {visibleCategories.map((category) => (
              <article key={category.category} className="fp-card">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Category</p>
                <h3 className="mt-3 text-xl font-semibold capitalize text-slate-950">{category.category}</h3>
                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <p>Retail offers {category.retail_offers_count}</p>
                  <p>Market quotes {category.market_quotes_count}</p>
                  {category.retail_median_lkr ? <p>Retail median Rs {formatCurrency(category.retail_median_lkr)}</p> : null}
                  {category.market_average_lkr ? <p>Market average Rs {formatCurrency(category.market_average_lkr)}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <NextActionLinks
          title="Next actions"
          links={[
            { label: 'Open retail', to: '/retail' },
            { label: 'Open markets', to: '/markets' },
            { label: 'Compare districts', to: '/compare' },
          ]}
        />
      </div>
    </section>
  )
}
