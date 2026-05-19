import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
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
    queryFn: () => api.getMarketQuotes('?limit=24'),
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
    <section className="space-y-12">
      <SectionHeader
        eyebrow="Wet Markets"
        title="Quotes from Pettah, Kandy, Galle and beyond"
        description="District-by-district produce quotes from official feeds and field stringers, plotted as historical series and listed as today’s spot prices."
      />

      {marketQuotesQuery.isError && (
        <ErrorState
          title="Markets desk has gone quiet"
          message="Market quotes could not be loaded."
          helper="Continue with retail discovery and district compare while market ingestion recovers."
          onRetry={() => marketQuotesQuery.refetch()}
          links={[{ label: 'Open retail floor', to: '/retail' }, { label: 'Open compare', to: '/compare' }]}
        />
      )}

      {/* — Trend chart — */}
      <article className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-kicker">§ Trend explorer</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">
            Quote series · official aggregate
          </span>
        </div>
        <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />

        <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr]">
          <label className="space-y-2">
            <span className="text-kicker">Commodity</span>
            <select
              value={activeTrendItem}
              onChange={(e) => setTrendItem(e.target.value)}
              className="fp-select"
              disabled={commodityOptions.length === 0}
            >
              {commodityOptions.length === 0 ? (
                <option value="">No commodities indexed</option>
              ) : (
                commodityOptions.map((item) => <option key={item} value={item}>{item}</option>)
              )}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-kicker">District</span>
            <select value={trendDistrict} onChange={(e) => setTrendDistrict(e.target.value)} className="fp-select">
              <option value="all">All districts</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6">
          {trendsSummaryQuery.isLoading || marketTrendQuery.isLoading ? (
            <SectionSkeleton cards={1} />
          ) : trendChartData.length > 1 ? (
            <div className="h-72 w-full" role="img" aria-label={`Price trend for ${activeTrendItem}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="marketTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8321E" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#C8321E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(14,14,12,0.08)" />
                  <XAxis dataKey="period" tick={{ fill: '#6B6657', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#0E0E0C', strokeWidth: 1 }} tickLine={false} />
                  <YAxis tick={{ fill: '#6B6657', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FBF7EE', border: '1px solid #0E0E0C', borderRadius: 0, color: '#0E0E0C', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                    labelStyle={{ color: '#3A372F' }}
                    formatter={(v) => [`රු ${Number(v).toLocaleString()}`, 'Avg price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#C8321E" strokeWidth={2} fill="url(#marketTrendGrad)" dot={false} activeDot={{ r: 4, fill: '#C8321E' }} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                <span className="num text-[color:var(--color-text-primary)]">{marketTrendQuery.data?.total_data_points ?? 0}</span> quote points
                {trendDistrictParam ? ` · ${trendDistrictParam}` : ' · national aggregate'}
              </p>
            </div>
          ) : (
            <EmptyState
              title="No trend series for this selection"
              description="Try another commodity or remove the district filter."
              hint="Quotes below show today’s spot prices regardless."
            />
          )}
        </div>
      </article>

      {/* — Filters — */}
      <div className="grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="space-y-2">
          <span className="text-kicker">Search markets</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="fp-input pl-10" placeholder="Tomato, Pettah, Colombo…" />
          </div>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">District</span>
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="fp-select">
            <option value="all">All districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Category</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="fp-select">
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-kicker">Sort</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
            <option value="price-low">Price ↗</option>
            <option value="price-high">Price ↘</option>
            <option value="district">District A–Z</option>
          </select>
        </label>
      </div>

      {/* — Stalls — */}
      {marketQuotesQuery.isLoading ? (
        <SectionSkeleton cards={6} />
      ) : !visibleQuotes.length ? (
        <EmptyState
          title="No quotes match this filter"
          description="Try broader filters or switch surfaces."
          hint="Next: retail or compare."
          actionLabel="Open retail"
          actionTo="/retail"
          secondaryActionLabel="Open compare"
          secondaryActionTo="/compare"
        />
      ) : (
        <div className="grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2 lg:grid-cols-3">
          {visibleQuotes.map((quote) => (
            <article key={quote.id} className="group flex flex-col gap-3 bg-[color:var(--color-bg-card)] p-5 transition-colors hover:bg-[color:var(--color-bg-card-hover)]">
              <div className="flex items-baseline justify-between">
                <span className="text-kicker">§ {quote.district}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">
                  {quote.category}
                </span>
              </div>
              <h3
                className="font-display text-[20px] leading-[1.1] tracking-[-0.025em] text-[color:var(--color-text-primary)]"
                style={{ fontVariationSettings: "'opsz' 36, 'wght' 600" }}
              >
                {quote.item_name}
              </h3>
              <p className="font-display text-[13px] italic leading-[1.4] text-[color:var(--color-text-secondary)]"
                style={{ fontVariationSettings: "'opsz' 24" }}>
                {quote.market_name}
              </p>
              <div className="rule-dotted mt-auto h-px w-full" aria-hidden="true" />
              <div className="flex items-end justify-between gap-3">
                <p className="num text-[28px] font-bold leading-none tracking-[-0.025em] text-[color:var(--color-text-primary)]">
                  <span className="text-[12px] font-semibold text-[color:var(--color-text-muted)]">රු </span>
                  {formatCurrency(quote.price_lkr)}
                  <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                    /{quote.unit}
                  </span>
                </p>
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">{quote.source}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">{formatCompactDate(quote.quoted_at)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <NextActionLinks
        title="Next column"
        links={[
          { label: 'Compare districts', to: '/compare' },
          { label: 'Category overview', to: '/categories' },
          { label: 'Build basket', to: '/basket' },
        ]}
      />
    </section>
  )
}
