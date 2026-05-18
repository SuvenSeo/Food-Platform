import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Search } from 'lucide-react'

import { Panel } from '../components/primitives/panel'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function BasketPage() {
  const [preset, setPreset] = useState('essentials')
  const [search, setSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'missing'>('all')
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'name'>('price-low')

  const basketQuery = useQuery({
    queryKey: ['basket-estimate', preset],
    queryFn: () => api.getBasketEstimate(preset),
  })
  const { saveEntry } = useWatchlists()
  const data = basketQuery.data
  const presetOptions = data?.available_presets.length ? data.available_presets : [{ id: preset, label: 'Loading preset...' }]

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (data?.items ?? [])
      .filter((item) => {
        if (availabilityFilter === 'available') return item.price_lkr !== null
        if (availabilityFilter === 'missing') return item.price_lkr === null
        return true
      })
      .filter((item) => `${item.label} ${item.source || ''}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (sortBy === 'name') return a.label.localeCompare(b.label)
        const ap = a.price_lkr ?? Infinity
        const bp = b.price_lkr ?? Infinity
        if (sortBy === 'price-high') return bp - ap
        return ap - bp
      })
  }, [availabilityFilter, data?.items, search, sortBy])

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Discovery tools"
        title="Basket workspace"
        description="Execution surface for household estimates with continuity from discovery and trust hints for each line item."
      />

      {basketQuery.isError && (
        <ErrorState
          title="Basket workspace unavailable"
          message="Basket estimates are currently unavailable."
          helper="Continue with retail and compare discovery while basket calculations recover."
          onRetry={() => basketQuery.refetch()}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open compare', to: '/compare' },
          ]}
        />
      )}

      <Panel variant="accent" className="space-y-6">
        {/* Preset selector */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="eyebrow-label">Basket preset</p>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`rounded-pill px-4 py-2 text-sm font-semibold transition-all ${
                    preset === item.id
                      ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25'
                      : 'border border-white/[0.08] text-[#737373] hover:text-[#a3a3a3]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          {data && (
            <button
              type="button"
              onClick={() => saveEntry({
                id: `basket-${data.preset.id}`,
                title: data.preset.label ?? 'Basket preset',
                kind: 'basket',
                href: `/basket?preset=${data.preset.id}`,
                summary: `${data.summary.available_items} items · Rs ${formatCurrency(data.summary.total_lkr ?? 0)}`,
              })}
              className="inline-flex items-center gap-2 rounded-pill bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/15"
            >
              <Bookmark className="h-4 w-4" />
              Save to watchlists
            </button>
          )}
        </div>

        {/* Summary KPIs */}
        {!basketQuery.isLoading && data && (
          <div className="hairline-grid rounded-lg overflow-hidden grid-cols-3">
            <div className="bg-[#0d0d0d] p-4">
              <p className="eyebrow-label">Estimated total</p>
              <p className="num mt-2 text-2xl font-semibold text-orange-400">
                Rs {formatCurrency(data.summary.total_lkr ?? 0)}
              </p>
            </div>
            <div className="bg-[#0d0d0d] p-4">
              <p className="eyebrow-label">Available</p>
              <p className="num mt-2 text-2xl font-semibold text-[#f5f5f5]">{data.summary.available_items}</p>
            </div>
            <div className="bg-[#0d0d0d] p-4">
              <p className="eyebrow-label">Missing</p>
              <p className="num mt-2 text-2xl font-semibold text-[#737373]">{data.summary.missing_items}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="fp-toolbar lg:grid-cols-4">
          <label className="space-y-2">
            <span className="eyebrow-label">Search items</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="fp-input pl-10"
                placeholder="oil, tomato, rice..."
              />
            </div>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Availability</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
              className="fp-select"
            >
              <option value="all">All items</option>
              <option value="available">Available only</option>
              <option value="missing">Missing only</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow-label">Sort</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="fp-select">
              <option value="price-low">Price: low → high</option>
              <option value="price-high">Price: high → low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </label>
        </div>

        {/* Items */}
        <RevealSection>
          {basketQuery.isLoading ? (
            <SectionSkeleton cards={4} />
          ) : !visibleItems.length ? (
            <EmptyState
              title="No basket items match this filter"
              description="Try broader filters, switch presets, or continue with adjacent discovery workflows."
              hint="Next action: continue in markets or compare."
              actionLabel="Open markets"
              actionTo="/markets"
              secondaryActionLabel="Open compare"
              secondaryActionTo="/compare"
            />
          ) : (
            <div className="space-y-2">
              {visibleItems.map((item, i) => (
                <motion.article
                  key={item.label}
                  className="fp-soft-card flex items-center justify-between gap-4"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-[#f5f5f5] truncate">{item.label}</h4>
                    <p className="text-xs text-[#737373] mt-0.5">{item.source || 'Source unavailable'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {item.price_lkr === null ? (
                      <Badge variant="neutral">N/A</Badge>
                    ) : (
                      <>
                        <Badge variant="green">Confirmed</Badge>
                        <p className="num text-base font-semibold text-[#f5f5f5]">
                          Rs {formatCurrency(item.price_lkr)}
                        </p>
                      </>
                    )}
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
            { label: 'Retail offers', to: '/retail' },
            { label: 'Review watchlists', to: '/watchlists' },
          ]}
        />
      </Panel>
    </section>
  )
}
