import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
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
      .filter((c) => c.category.toLowerCase().includes(needle))
      .sort((a, b) => {
        const ac = a.retail_offers_count + a.market_quotes_count
        const bc = b.retail_offers_count + b.market_quotes_count
        if (sortBy === 'retail') return b.retail_offers_count - a.retail_offers_count
        if (sortBy === 'market') return b.market_quotes_count - a.market_quotes_count
        if (sortBy === 'name') return a.category.localeCompare(b.category)
        return bc - ac
      })
  }, [categories, search, sortBy])

  if (categoriesQuery.isLoading) return <LoadingBlock />
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
        {/* Toolbar */}
        <div className="fp-toolbar md:grid-cols-[1.3fr_1fr] lg:grid-cols-[1.3fr_1fr]">
          <label className="space-y-2">
            <span className="eyebrow-label">Search category</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="grocery, vegetables, dairy..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
              <option value="coverage">Coverage: highest first</option>
              <option value="retail">Retail depth</option>
              <option value="market">Market depth</option>
              <option value="name">Name: A-Z</option>
            </select>
          </label>
        </div>

        <RevealSection>
          {!visibleCategories.length ? (
            <EmptyState
              title="No categories match your search"
              description="Try a broader query or open markets to continue from district-level data."
              actionLabel="Open markets"
              actionTo="/markets"
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-3">
              {visibleCategories.map((cat, i) => {
                const totalCoverage = cat.retail_offers_count + cat.market_quotes_count
                return (
                  <motion.article
                    key={cat.category}
                    className="premium-card p-5 group"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="eyebrow-label">Category</p>
                      <Badge variant="neutral">{totalCoverage} signals</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold capitalize text-[#f5f5f5]"
                      style={{ letterSpacing: '-0.02em' }}>
                      {cat.category}
                    </h3>

                    <div
                      className="mt-4 grid grid-cols-2 gap-2 border-t pt-4"
                      style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                    >
                      <div>
                        <p className="text-xs text-[#737373]">Retail offers</p>
                        <p className="num mt-1 text-lg font-semibold text-[#f5f5f5]">{cat.retail_offers_count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#737373]">Market quotes</p>
                        <p className="num mt-1 text-lg font-semibold text-[#f5f5f5]">{cat.market_quotes_count}</p>
                      </div>
                    </div>

                    {(cat.retail_median_lkr || cat.market_average_lkr) && (
                      <div className="mt-3 space-y-1.5">
                        {cat.retail_median_lkr && (
                          <p className="text-xs text-[#737373]">
                            Retail median <span className="num text-[#a3a3a3]">Rs {formatCurrency(cat.retail_median_lkr)}</span>
                          </p>
                        )}
                        {cat.market_average_lkr && (
                          <p className="text-xs text-[#737373]">
                            Market avg <span className="num text-[#a3a3a3]">Rs {formatCurrency(cat.market_average_lkr)}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Coverage bar */}
                    <div className="mt-4">
                      <div className="h-1 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700"
                          style={{ width: `${Math.min((totalCoverage / 50) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          )}
        </RevealSection>

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
