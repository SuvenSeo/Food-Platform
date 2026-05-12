import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'

import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

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
  const districts = useMemo(() => Array.from(new Set(quotes.map((q) => q.district))).sort(), [quotes])
  const categories = useMemo(() => Array.from(new Set(quotes.map((q) => q.category))).sort(), [quotes])

  const visibleQuotes = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return quotes
      .filter((q) => (districtFilter === 'all' ? true : q.district === districtFilter))
      .filter((q) => (categoryFilter === 'all' ? true : q.category === categoryFilter))
      .filter((q) => {
        if (!needle) return true
        return [q.item_name, q.market_name, q.district, q.category].join(' ').toLowerCase().includes(needle)
      })
      .sort((a, b) => {
        if (sortBy === 'price-high') return b.price_lkr - a.price_lkr
        if (sortBy === 'district') return a.district.localeCompare(b.district)
        return a.price_lkr - b.price_lkr
      })
  }, [categoryFilter, districtFilter, quotes, search, sortBy])

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Discovery"
        title="Wet-market quotes"
        description="Public-market discovery surface with district filters, freshness context, and provenance hints."
      />

      {marketQuotesQuery.isError && (
        <ErrorState
          title="Market discovery feed unavailable"
          message="Market quotes could not be loaded."
          helper="Continue with retail discovery and district compare while market ingestion recovers."
          onRetry={() => marketQuotesQuery.refetch()}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open compare', to: '/compare' },
          ]}
        />
      )}

      <div className="fp-panel space-y-6">
        {/* Toolbar */}
        <div className="fp-toolbar">
          <label className="space-y-2 md:col-span-2">
            <span className="eyebrow-label">Search item or market</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="Tomato, Pettah, Colombo..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">District</span>
            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="fp-select">
              <option value="all">All districts</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Category</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="fp-select">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
              <option value="price-low">Price: low → high</option>
              <option value="price-high">Price: high → low</option>
              <option value="district">District: A–Z</option>
            </select>
          </label>
        </div>

        {/* Results */}
        <RevealSection>
          {marketQuotesQuery.isLoading ? (
            <SectionSkeleton cards={4} />
          ) : !visibleQuotes.length ? (
            <EmptyState
              title="No market quotes found"
              description="Try broader filters or move to another discovery surface."
              hint="Next action: continue in retail or compare."
              actionLabel="Open retail discovery"
              actionTo="/retail"
              secondaryActionLabel="Open compare"
              secondaryActionTo="/compare"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleQuotes.map((quote, i) => (
                <motion.article
                  key={quote.id}
                  className="premium-card p-5"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow-label">{quote.district}</p>
                      <h3 className="mt-2 text-base font-semibold text-[#f5f5f5]">{quote.market_name}</h3>
                      <p className="mt-0.5 text-sm font-medium text-[#a3a3a3]">{quote.item_name}</p>
                    </div>
                    <Badge variant="neutral">{quote.category}</Badge>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t pt-4"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div>
                      <p className="num text-2xl font-semibold text-[#f5f5f5]">
                        Rs {formatCurrency(quote.price_lkr)}
                      </p>
                      <p className="text-xs text-[#737373]">per {quote.unit}</p>
                    </div>
                    <div className="text-right text-xs text-[#404040]">
                      <p>{quote.source}</p>
                      <p>{formatCompactDate(quote.quoted_at)}</p>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </RevealSection>

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
