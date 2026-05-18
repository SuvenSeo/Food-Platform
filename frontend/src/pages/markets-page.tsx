import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useMarketTrend } from '../hooks/use-market-trend'
import { useTrendsSummary } from '../hooks/use-trends-summary'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency, mapTrendSeriesToChart } from '../lib/format'

export function MarketsPage() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'district'>('price-low')
  const [trendItem, setTrendItem] = useState<string | null>(null)
  const [trendDistrict, setTrendDistrict] = useState('all')

  const marketQuotesQuery = useQuery({
    queryKey: ['market-quotes', 'markets-page'],
    queryFn: () => api.getMarketQuotes('?limit=12'),
  })
  const trendsSummaryQuery = useTrendsSummary()

  const quotes = useMemo(() => marketQuotesQuery.data?.items ?? [], [marketQuotesQuery.data?.items])
  const districts = useMemo(() => Array.from(new Set(quotes.map((q) => q.district))).sort(), [quotes])
  const categories = useMemo(() => Array.from(new Set(quotes.map((q) => q.category))).sort(), [quotes])

  const commodityOptions = useMemo(() => {
    const fromTrends = (trendsSummaryQuery.data?.top_items ?? []).map((item) => item.item_name)
    const fromQuotes = quotes.map((q) => q.item_name)
    return Array.from(new Set([...fromTrends, ...fromQuotes])).sort((a, b) => a.localeCompare(b))
  }, [quotes, trendsSummaryQuery.data?.top_items])

  const activeTrendItem = trendItem ?? commodityOptions[0] ?? ''

  const trendDistrictParam = trendDistrict === 'all' ? undefined : trendDistrict
  const marketTrendQuery = useMarketTrend(activeTrendItem, {
    district: trendDistrictParam,
    enabled: Boolean(activeTrendItem),
  })
  const trendChartData = mapTrendSeriesToChart(marketTrendQuery.data?.series ?? [])

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
        <SectionHeader
          eyebrow="Trend explorer"
          title="Commodity price series"
          description="Pick a commodity and optional district to plot official market quote history."
        />

        <motion.div className="fp-toolbar">
          <label className="space-y-2 md:col-span-2">
            <span className="eyebrow-label" id="trend-item-label">Commodity</span>
            <select
              id="trend-item"
              aria-labelledby="trend-item-label"
              value={activeTrendItem}
              onChange={(e) => setTrendItem(e.target.value)}
              className="fp-select"
              disabled={commodityOptions.length === 0}
            >
              {commodityOptions.length === 0 ? (
                <option value="">No commodities indexed</option>
              ) : (
                commodityOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))
              )}
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label" id="trend-district-label">District (trend)</span>
            <select
              id="trend-district"
              aria-labelledby="trend-district-label"
              value={trendDistrict}
              onChange={(e) => setTrendDistrict(e.target.value)}
              className="fp-select"
            >
              <option value="all">All districts</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </motion.div>

        {trendsSummaryQuery.isLoading || marketTrendQuery.isLoading ? (
          <SectionSkeleton cards={1} />
        ) : trendChartData.length > 1 ? (
          <div
            className="h-64 w-full"
            role="img"
            aria-label={activeTrendItem ? `Price trend for ${activeTrendItem}` : 'Commodity price trend'}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="marketTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="period" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#f5f5f5', fontSize: 12 }}
                  labelStyle={{ color: '#a3a3a3' }}
                  formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Avg price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#marketTrendGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#f97316' }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="mt-3 text-xs text-[#737373]">
              {marketTrendQuery.data?.total_data_points ?? 0} quote points
              {trendDistrictParam ? ` · filtered to ${trendDistrictParam}` : ' · national aggregate'}
            </p>
          </div>
        ) : (
          <EmptyState
            title="No trend series for this selection"
            description="Try another commodity or remove the district filter. Empty series means we have no historical quotes indexed yet."
            hint="Quotes below show the latest spot prices even when history is sparse."
            actionLabel="Open compare"
            actionTo="/compare"
          />
        )}

        <div className="fp-toolbar border-t pt-6" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <label className="space-y-2 md:col-span-2">
            <span className="eyebrow-label" id="market-search-label">Search item or market</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" aria-hidden="true" />
              <input
                id="market-search"
                aria-labelledby="market-search-label"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="Tomato, Pettah, Colombo..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label" id="quote-district-label">District</span>
            <select
              id="quote-district"
              aria-labelledby="quote-district-label"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="fp-select"
            >
              <option value="all">All districts</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label" id="quote-category-label">Category</span>
            <select
              id="quote-category"
              aria-labelledby="quote-category-label"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="fp-select"
            >
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label" id="quote-sort-label">Sort</span>
            <select
              id="quote-sort"
              aria-labelledby="quote-sort-label"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="fp-select"
            >
              <option value="price-low">Price: low → high</option>
              <option value="price-high">Price: high → low</option>
              <option value="district">District: A–Z</option>
            </select>
          </label>
        </div>

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
