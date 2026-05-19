import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ArrowLeftRight, Bookmark, ReceiptText, Search } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

import { Badge } from '../components/ui/badge'
import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
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
      .sort((a, b) => {
        const aDelta = Math.abs(a.delta_lkr)
        const bDelta = Math.abs(b.delta_lkr)
        if (sortBy === 'item') return a.item_name.localeCompare(b.item_name)
        if (sortBy === 'delta-low') return aDelta - bDelta
        return bDelta - aDelta
      })
  }, [data?.items, search, sortBy])

  const chartData = visibleItems.slice(0, 8).map((item) => ({
    name: item.item_name.length > 11 ? `${item.item_name.slice(0, 10)}…` : item.item_name,
    left: item.left_price_lkr,
    right: item.right_price_lkr,
  }))

  const isLoading = compareQuery.isLoading || marketsQuery.isLoading
  const leftWins = visibleItems.filter((item) => item.cheaper_side === data?.left).length
  const rightWins = visibleItems.filter((item) => item.cheaper_side === data?.right).length
  const averageDelta = visibleItems.length
    ? visibleItems.reduce((sum, item) => sum + Math.abs(item.delta_lkr), 0) / visibleItems.length
    : 0

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="District receipt"
        title="Compare district-vs-district"
        description="A side-by-side receipt for public market quotes: choose two districts, scan the deltas, then clip the comparison into watchlists."
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

      <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="min-w-0 space-y-4">
          <div className="border-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] p-5 shadow-stamp">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-[color:var(--chili-500)]" aria-hidden="true" />
              <p className="text-kicker">Compare receipt</p>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="space-y-2">
                <span className="eyebrow-label">Left district</span>
                <select
                  aria-label="Left district"
                  value={leftDistrict}
                  onChange={(event) => setLeftDistrict(event.target.value)}
                  className="fp-select"
                >
                  {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </label>

              <button
                type="button"
                onClick={() => { setLeftDistrict(rightDistrict); setRightDistrict(leftDistrict) }}
                className="fp-button-secondary w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--chili-500)]"
              >
                <ArrowLeftRight className="h-4 w-4" />
                Swap districts
              </button>

              <label className="space-y-2">
                <span className="eyebrow-label">Right district</span>
                <select
                  aria-label="Right district"
                  value={rightDistrict}
                  onChange={(event) => setRightDistrict(event.target.value)}
                  className="fp-select"
                >
                  {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                </select>
              </label>
            </div>

            {data && (
              <button
                type="button"
                onClick={() => saveEntry({
                  id: `compare-${data.left}-${data.right}`,
                  title: `${data.left} vs ${data.right}`,
                  kind: 'compare',
                  href: '/compare',
                  summary: `${data.items.length ?? 0} shared produce items`,
                })}
                className="fp-button-primary mt-5 w-full"
              >
                <Bookmark className="h-4 w-4" />
                Clip receipt
              </button>
            )}
          </div>

          {data && (
            <div className="grid gap-[1px] bg-[color:var(--color-border)]">
              {[
                { label: `${data.left} cheaper`, value: leftWins },
                { label: `${data.right} cheaper`, value: rightWins },
                { label: 'Average gap', value: `රු ${formatCurrency(averageDelta)}` },
              ].map((item) => (
                <div key={item.label} className="bg-[color:var(--color-bg-card)] p-4">
                  <p className="text-kicker">{item.label}</p>
                  <p className="num mt-2 text-2xl font-bold text-[color:var(--color-text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          {!isLoading && chartData.length > 1 && (
            <div className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 shadow-paper">
              <p className="text-kicker">Top receipt lines</p>
              <div className="mt-4 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={55} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 0, color: 'var(--color-text-primary)', fontSize: 12 }}
                      formatter={(value) => [`Rs ${Number(value).toLocaleString()}`]}
                    />
                    <Bar dataKey="left" fill="var(--chili-500)" name={leftDistrict} />
                    <Bar dataKey="right" fill="var(--ink-400)" name={rightDistrict} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="fp-toolbar md:grid-cols-[1.4fr_1fr] lg:grid-cols-[1.4fr_1fr]">
            <label className="space-y-2">
              <span className="eyebrow-label">Search compared items</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="fp-input pl-10"
                  placeholder="Tomato, onion, leafy greens..."
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="eyebrow-label">Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="fp-select">
                <option value="delta-high">Largest delta first</option>
                <option value="delta-low">Smallest delta first</option>
                <option value="item">Item name A-Z</option>
              </select>
            </label>
          </div>

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
            {visibleItems.map((item, index) => {
              const cheaperDistrict = item.cheaper_side === 'equal' ? 'Equal' : item.cheaper_side
              return (
                <article
                  key={item.item_name}
                  className="grid gap-3 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 shadow-paper md:grid-cols-[56px_1fr_auto]"
                >
                  <p className="num font-mono text-xs font-bold text-[color:var(--color-text-muted)]">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">{item.item_name}</h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-text-muted)]">{item.category}</p>
                    <div className="mt-4 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
                      <div className="bg-[color:var(--color-bg-secondary)] p-3">
                        <p className="eyebrow-label">{data?.left}</p>
                        <p className="num mt-1 text-lg font-bold text-[color:var(--color-text-primary)]">රු {formatCurrency(item.left_price_lkr)}</p>
                      </div>
                      <div className="bg-[color:var(--color-bg-secondary)] p-3">
                        <p className="eyebrow-label">{data?.right}</p>
                        <p className="num mt-1 text-lg font-bold text-[color:var(--color-text-primary)]">රු {formatCurrency(item.right_price_lkr)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <Badge variant={cheaperDistrict === data?.left || cheaperDistrict === data?.right ? 'green' : 'neutral'}>
                      {cheaperDistrict} cheaper
                    </Badge>
                    <p className="num mt-2 text-lg font-bold text-[color:var(--chili-600)]">
                      රු {formatCurrency(Math.abs(item.delta_lkr))}
                    </p>
                  </div>
                </article>
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
      </div>
    </section>
  )
}
