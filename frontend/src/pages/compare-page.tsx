import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Bookmark, Search } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
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
    [marketsQuery.data?.items]
  )
  const districtOptions = districts.length > 0 ? districts : [leftDistrict, rightDistrict]
  const data = compareQuery.data

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.items ?? [])
      .filter((item) => `${item.item_name} ${item.category}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        const aDelta = Math.abs(a.delta_lkr)
        const bDelta = Math.abs(b.delta_lkr)
        if (sortBy === 'item') return a.item_name.localeCompare(b.item_name)
        if (sortBy === 'delta-low') return aDelta - bDelta
        return bDelta - aDelta
      })
  }, [data?.items, search, sortBy])

  const chartData = visibleItems.slice(0, 8).map((item) => ({
    name: item.item_name.slice(0, 10),
    left: item.left_price_lkr,
    right: item.right_price_lkr,
  }))

  const isLoading = compareQuery.isLoading || marketsQuery.isLoading

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Discovery"
        title="Compare stores, districts, and food clusters"
        description="Comparison workspace between discovery and intelligence: district deltas with continuity into watchlists and basket plans."
      />

      {(marketsQuery.isError || compareQuery.isError) && (
        <ErrorState
          title="Compare surface unavailable"
          message="District comparison data could not be loaded."
          helper="Keep exploring with retail and markets pages while compare signals recover."
          onRetry={() => { void marketsQuery.refetch(); void compareQuery.refetch() }}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open markets discovery', to: '/markets' },
          ]}
        />
      )}

      <div className="fp-panel space-y-6">
        {/* District selector */}
        <div className="grid items-end gap-3 rounded-card border p-4 md:grid-cols-[1fr_auto_1fr]"
          style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0a0a0a' }}>
          <label className="space-y-2">
            <span className="eyebrow-label">Left district</span>
            <select
              aria-label="Left district"
              value={leftDistrict}
              onChange={(e) => setLeftDistrict(e.target.value)}
              className="fp-select"
            >
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <button
            type="button"
            onClick={() => { setLeftDistrict(rightDistrict); setRightDistrict(leftDistrict) }}
            className="mb-0.5 inline-flex items-center gap-2 rounded-pill border border-white/[0.10] px-4 py-2.5 text-sm text-[#a3a3a3] transition hover:text-[#f5f5f5] hover:border-white/[0.18]"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Swap</span>
          </button>

          <label className="space-y-2">
            <span className="eyebrow-label">Right district</span>
            <select
              aria-label="Right district"
              value={rightDistrict}
              onChange={(e) => setRightDistrict(e.target.value)}
              className="fp-select"
            >
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        {/* Headline + save */}
        {data && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3
              className="text-[#f5f5f5]"
              style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', letterSpacing: '-0.025em' }}
            >
              {data.left} <span className="text-[#737373]">vs</span> {data.right}
            </h3>
            <button
              type="button"
              onClick={() => saveEntry({
                id: `compare-${data.left}-${data.right}`,
                title: `${data.left} vs ${data.right}`,
                kind: 'compare',
                href: '/compare',
                summary: `${data.items.length ?? 0} shared produce items`,
              })}
              className="inline-flex items-center gap-2 rounded-pill bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/15"
            >
              <Bookmark className="h-4 w-4" />
              Save view
            </button>
          </div>
        )}

        {/* Bar chart */}
        {!isLoading && chartData.length > 1 && (
          <RevealSection>
            <div className="rounded-card border p-4"
              style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0a0a0a' }}>
              <p className="eyebrow-label mb-4">Price comparison — top 8 items</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#f5f5f5', fontSize: 12 }}
                      formatter={(v) => [`Rs ${Number(v).toLocaleString()}`]}
                    />
                    <Bar dataKey="left" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} name={leftDistrict} />
                    <Bar dataKey="right" fill="#737373" radius={[4, 4, 0, 0]} opacity={0.65} name={rightDistrict} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-5 text-xs text-[#737373]">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-orange-500" />{leftDistrict}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#737373]" />{rightDistrict}</span>
              </div>
            </div>
          </RevealSection>
        )}

        {/* Filters */}
        <div className="fp-toolbar md:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.4fr_1fr]">
          <label className="space-y-2">
            <span className="eyebrow-label">Search compared items</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="Tomato, onion, leafy greens..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
              <option value="delta-high">Largest delta first</option>
              <option value="delta-low">Smallest delta first</option>
              <option value="item">Item name A-Z</option>
            </select>
          </label>
        </div>

        {/* Results */}
        <div className="space-y-3">
          {isLoading ? <SectionSkeleton cards={4} /> : null}
          {!isLoading && !visibleItems.length && (
            <EmptyState
              title="No overlapping produce items found"
              description="Try a different district pair or continue through adjacent discovery flows."
              hint="Next action: continue in markets or categories."
              actionLabel="Open categories"
              actionTo="/categories"
              secondaryActionLabel="Open markets"
              secondaryActionTo="/markets"
            />
          )}
          {visibleItems.map((item, i) => {
            const isLeft = item.cheaper_side === data?.left
            return (
              <motion.article
                key={item.item_name}
                className="fp-soft-card"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#f5f5f5]">{item.item_name}</h4>
                    <p className="text-sm capitalize text-[#737373]">{item.category}</p>
                  </div>
                  <Badge variant="green">
                    {item.cheaper_side} cheaper by Rs {formatCurrency(Math.abs(item.delta_lkr))}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div
                    className={`rounded-md p-3 border ${isLeft ? 'border-orange-500/20 bg-orange-500/[0.05]' : 'border-white/[0.07] bg-[#111111]'}`}
                  >
                    <p className="text-xs font-semibold text-[#a3a3a3]">{data?.left}</p>
                    <p className="num mt-1.5 text-lg font-semibold text-[#f5f5f5]">
                      Rs {formatCurrency(item.left_price_lkr)}
                    </p>
                    {isLeft && <Badge variant="green" className="mt-2">Cheaper</Badge>}
                  </div>
                  <div
                    className={`rounded-md p-3 border ${!isLeft ? 'border-orange-500/20 bg-orange-500/[0.05]' : 'border-white/[0.07] bg-[#111111]'}`}
                  >
                    <p className="text-xs font-semibold text-[#a3a3a3]">{data?.right}</p>
                    <p className="num mt-1.5 text-lg font-semibold text-[#f5f5f5]">
                      Rs {formatCurrency(item.right_price_lkr)}
                    </p>
                    {!isLeft && <Badge variant="green" className="mt-2">Cheaper</Badge>}
                  </div>
                </div>
              </motion.article>
            )
          })}
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
