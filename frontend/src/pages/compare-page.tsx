import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, Bookmark, Search } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { Badge } from '../components/ui/badge'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

const springTransition = { type: 'spring' as const, stiffness: 300, damping: 30 }

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: springTransition }
}

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

      <motion.div 
        className="space-y-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* District selector */}
        <motion.div variants={staggerItem} className="premium-surface grid items-end gap-3 rounded-card p-4 md:grid-cols-[1fr_auto_1fr]">
          <label className="space-y-2">
            <span className="eyebrow-label tracking-tight">Left district</span>
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
            className="mb-0.5 inline-flex items-center justify-center gap-2 rounded-pill border border-white/10 px-4 py-2.5 text-sm text-secondary-foreground transition hover:text-foreground hover:border-white/20 hover:bg-white/5"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Swap</span>
          </button>

          <label className="space-y-2">
            <span className="eyebrow-label tracking-tight">Right district</span>
            <select
              aria-label="Right district"
              value={rightDistrict}
              onChange={(e) => setRightDistrict(e.target.value)}
              className="fp-select"
            >
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </motion.div>

        {/* Headline + save */}
        {data && (
          <motion.div variants={staggerItem} className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-foreground font-display tracking-tight" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
              {data.left} <span className="text-muted-foreground">vs</span> {data.right}
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
              className="inline-flex items-center gap-2 rounded-pill bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/20 hover:text-orange-300 tracking-tight"
            >
              <Bookmark className="h-4 w-4" />
              Save view
            </button>
          </motion.div>
        )}

        {/* Bar chart */}
        {!isLoading && chartData.length > 1 && (
          <motion.div variants={staggerItem}>
            <div className="premium-surface rounded-card p-4">
              <p className="eyebrow-label tracking-tight mb-4">Price comparison — top 8 items</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--foreground)', fontSize: 12 }}
                      formatter={(v) => [`Rs ${Number(v).toLocaleString()}`]}
                    />
                    <Bar dataKey="left" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.85} name={leftDistrict} />
                    <Bar dataKey="right" fill="#737373" radius={[4, 4, 0, 0]} opacity={0.65} name={rightDistrict} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex gap-5 text-xs text-muted-foreground tracking-tight">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-orange-500" />{leftDistrict}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-neutral-500" />{rightDistrict}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={staggerItem} className="fp-toolbar md:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.4fr_1fr]">
          <label className="space-y-2">
            <span className="eyebrow-label tracking-tight">Search compared items</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="Tomato, onion, leafy greens..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label tracking-tight">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
              <option value="delta-high">Largest delta first</option>
              <option value="delta-low">Smallest delta first</option>
              <option value="item">Item name A-Z</option>
            </select>
          </label>
        </motion.div>

        {/* Results */}
        <motion.div variants={staggerItem} className="space-y-3">
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
          {visibleItems.map((item) => {
            const isLeft = item.cheaper_side === data?.left
            return (
              <motion.article
                key={item.item_name}
                className="fp-soft-card premium-surface border-transparent"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                variants={staggerItem}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-foreground tracking-tight">{item.item_name}</h4>
                    <p className="text-sm capitalize text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge variant="green">
                    {item.cheaper_side} cheaper by Rs {formatCurrency(Math.abs(item.delta_lkr))}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div
                    className={`rounded-md p-3 border ${isLeft ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5 bg-white/5'}`}
                  >
                    <p className="text-xs font-semibold text-secondary-foreground tracking-tight">{data?.left}</p>
                    <p className="num mt-1.5 text-lg font-semibold text-foreground tracking-tight">
                      Rs {formatCurrency(item.left_price_lkr)}
                    </p>
                    {isLeft && <Badge variant="green" className="mt-2">Cheaper</Badge>}
                  </div>
                  <div
                    className={`rounded-md p-3 border ${!isLeft ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5 bg-white/5'}`}
                  >
                    <p className="text-xs font-semibold text-secondary-foreground tracking-tight">{data?.right}</p>
                    <p className="num mt-1.5 text-lg font-semibold text-foreground tracking-tight">
                      Rs {formatCurrency(item.right_price_lkr)}
                    </p>
                    {!isLeft && <Badge variant="green" className="mt-2">Cheaper</Badge>}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </motion.div>

        <motion.div variants={staggerItem}>
          <NextActionLinks
            title="Next actions"
            links={[
              { label: 'Build basket', to: '/basket' },
              { label: 'Review watchlists', to: '/watchlists' },
              { label: 'Open markets', to: '/markets' },
            ]}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
