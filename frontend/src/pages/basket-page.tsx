import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Search } from 'lucide-react'

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

      <div className="space-y-6">
        {/* Preset selector */}
        <div className="premium-surface rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <p className="eyebrow-label">Basket preset</p>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPreset(item.id)}
                  className={`rounded-pill px-4 py-2 text-sm font-medium transition-all ${
                    preset === item.id
                      ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                      : 'bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10'
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
              className="inline-flex items-center gap-2 rounded-pill bg-white/5 px-5 py-2.5 text-sm font-medium text-foreground ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20"
            >
              <Bookmark className="h-4 w-4 text-orange-400" />
              Save to watchlists
            </button>
          )}
        </div>

        {/* Summary KPIs - Stats Bento */}
        {!basketQuery.isLoading && data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-surface rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:ring-1 hover:ring-orange-500/30 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="eyebrow-label text-orange-400/80">Estimated total</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-muted-foreground text-sm font-medium">Rs</span>
                <p className="num text-4xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(data.summary.total_lkr ?? 0)}
                </p>
              </div>
            </div>
            <div className="premium-surface rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:ring-1 hover:ring-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="eyebrow-label">Available Items</p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="num text-4xl font-medium tracking-tight text-foreground">{data.summary.available_items}</p>
                <span className="text-muted-foreground text-sm font-medium">/ {data.items.length}</span>
              </div>
            </div>
            <div className="premium-surface rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 hover:ring-1 hover:ring-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <p className="eyebrow-label">Missing Quotes</p>
              <p className="num mt-3 text-4xl font-medium tracking-tight text-muted-foreground">{data.summary.missing_items}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="premium-surface rounded-2xl p-2 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-0 ring-0 focus:ring-0 pl-11 pr-4 py-3 text-sm placeholder:text-muted-foreground"
              placeholder="Search basket items (e.g. oil, tomato, rice...)"
            />
          </div>
          <div className="h-px md:w-px md:h-auto bg-white/10 mx-2" />
          <div className="flex gap-2 p-1 relative items-center">
             <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value as typeof availabilityFilter)}
              className="bg-transparent border-0 text-sm font-medium text-foreground focus:ring-0 cursor-pointer appearance-none px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <option value="all" className="bg-background">All instances</option>
              <option value="available" className="bg-background">Available only</option>
              <option value="missing" className="bg-background">Missing only</option>
            </select>
            
            <div className="h-4 w-px bg-white/10" />
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)} 
              className="bg-transparent border-0 text-sm font-medium text-foreground focus:ring-0 cursor-pointer appearance-none px-4 py-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <option value="price-low" className="bg-background">Lowest price</option>
              <option value="price-high" className="bg-background">Highest price</option>
              <option value="name" className="bg-background">Alphabetical</option>
            </select>
          </div>
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
            <motion.div 
              className="grid gap-3"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.04
                  }
                }
              }}
              initial="hidden"
              animate="show"
            >
              {visibleItems.map((item) => (
                <motion.article
                  key={item.label}
                  className="premium-surface rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-200 hover:ring-1 hover:ring-white/20 hover:bg-white/[0.04]"
                  variants={{
                    hidden: { opacity: 0, y: 15, scale: 0.98 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } }
                  }}
                >
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-medium text-foreground truncate">{item.label}</h4>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                       <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{item.source || 'Source unavailable'}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {item.price_lkr === null ? (
                      <Badge variant="neutral" className="bg-white/5">N/A</Badge>
                    ) : (
                      <div className="text-right">
                        <p className="num text-lg font-medium tracking-tight text-foreground">
                          <span className="text-xs font-normal text-muted-foreground mr-1">Rs</span>
                          {formatCurrency(item.price_lkr)}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </motion.div>
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
      </div>
    </section>
  )
}
