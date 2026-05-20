import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ArrowUpRight, Clock3, LayoutGrid, Search, Store, Waves } from 'lucide-react'

import { AlertSignup } from '../components/retention/alert-signup'
import { FoodItemImage } from '../components/primitives/food-item-image'
import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'
import type { ItemSummary } from '../types'

type WorkspaceTab = 'all' | 'retail' | 'market' | 'history'

function itemPrice(item: ItemSummary) {
  return item.lowest_price_lkr ?? item.price_per_unit_lkr ?? item.median_price_lkr ?? item.average_market_price_lkr ?? null
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [tab, setTab] = useState<WorkspaceTab>((searchParams.get('tab') as WorkspaceTab | null) ?? 'all')

  const params = useMemo(() => {
    const next = new URLSearchParams({ limit: '120' })
    if (search.trim()) next.set('search', search.trim())
    return `?${next.toString()}`
  }, [search])

  const itemsQuery = useQuery({
    queryKey: ['items', params],
    queryFn: () => api.getItems(params),
  })
  const trendsQuery = useQuery({
    queryKey: ['trends-summary', 'prices-workspace'],
    queryFn: () => api.getTrendsSummary(),
  })

  const allItems = itemsQuery.data?.items ?? []
  const retailCount = allItems.filter((item) => item.kind === 'retail').length
  const marketCount = allItems.filter((item) => item.kind === 'market').length
  const visibleItems = allItems.filter((item) => {
    if (tab === 'retail') return item.kind === 'retail'
    if (tab === 'market') return item.kind === 'market'
    if (tab === 'history') return false
    return true
  })
  const historyRows = trendsQuery.data?.top_items ?? []

  const tabOptions = [
    { value: 'all', label: 'All', count: allItems.length, icon: LayoutGrid },
    { value: 'retail', label: 'Retail', count: retailCount, icon: Store },
    { value: 'market', label: 'Market', count: marketCount, icon: Waves },
    { value: 'history', label: 'History', count: historyRows.length, icon: Clock3 },
  ] as const

  function updateSearch(value: string) {
    setSearch(value)
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('search', value.trim())
    else next.delete('search')
    if (tab !== 'all') next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  function updateTab(value: WorkspaceTab) {
    setTab(value)
    const next = new URLSearchParams(searchParams)
    if (search.trim()) next.set('search', search.trim())
    if (value === 'all') next.delete('tab')
    else next.set('tab', value)
    setSearchParams(next, { replace: true })
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Price workspace"
        title="Search food prices by item, source, and history"
        description="This is the canonical FoodLK workbench: search once, inspect retail and market signals, then continue into comparison, trends, or alerts."
      />

      <div className="grid gap-4 border-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] p-4 lg:grid-cols-[1.15fr_0.85fr]">
        <label className="space-y-2">
          <span className="text-kicker">Search item, category, or source</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              className="fp-input pl-10"
              placeholder="Rice, dhal, coconut oil, carrot..."
            />
          </div>
        </label>
        <div className="space-y-2">
          <span className="text-kicker">Workspace view</span>
          <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {tabOptions.map(({ value, label, count, icon: Icon }) => (
              <button
                key={value}
                type="button"
                data-active={tab === value}
                aria-pressed={tab === value}
                onClick={() => updateTab(value)}
                className="catalog-kind-button"
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{label}</span>
                  <span className="num mt-1 block text-xl font-bold">{count.toLocaleString()}</span>
                </span>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-4">
        {[
          { label: 'Visible rows', value: tab === 'history' ? historyRows.length : visibleItems.length },
          { label: 'Retail items', value: retailCount },
          { label: 'Market items', value: marketCount },
          { label: 'History series', value: historyRows.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-[color:var(--color-bg-card)] p-4">
            <p className="text-kicker">{stat.label}</p>
            <p className="num mt-2 text-2xl font-bold text-[color:var(--color-text-primary)]">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {itemsQuery.isError ? (
        <ErrorState message="Unable to load the price workspace right now." onRetry={() => itemsQuery.refetch()} />
      ) : itemsQuery.isLoading ? (
        <SectionSkeleton cards={8} />
      ) : tab === 'history' ? (
        trendsQuery.isLoading ? (
          <SectionSkeleton cards={4} />
        ) : !historyRows.length ? (
          <EmptyState
            title="No history rows yet"
            description="Market history needs dated quote rows before FoodLK can draw a useful price archive."
            actionLabel="Open trends"
            actionTo="/intelligence"
          />
        ) : (
          <div className="overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)]">
            <div className="hidden grid-cols-[56px_64px_1fr_0.8fr_0.8fr_auto] border-b border-[color:var(--color-text-primary)] bg-[color:var(--color-bg-secondary)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)] md:grid">
              <span>No.</span>
              <span aria-hidden="true" />
              <span>Item</span>
              <span>Data points</span>
              <span>Average</span>
              <span>Open</span>
            </div>
            {historyRows.map((row, index) => (
              <Link
                key={`${row.item_name}-${index}`}
                to={`/items/${slugify(row.item_name)}`}
                className="grid gap-3 border-b border-dotted border-[color:var(--color-border-hover)] px-4 py-4 last:border-b-0 md:grid-cols-[56px_64px_1fr_0.8fr_0.8fr_auto] md:items-center"
              >
                <span className="num font-mono text-xs text-[color:var(--color-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
                <FoodItemImage src={row.image_url} name={row.item_name} className="h-16 w-16" />
                <span>
                  <span className="block font-display text-lg font-semibold text-[color:var(--color-text-primary)]">{row.item_name}</span>
                  <span className="text-sm text-[color:var(--color-text-muted)]">{formatCompactDate(row.earliest)} - {formatCompactDate(row.latest)}</span>
                </span>
                <span className="num font-bold text-[color:var(--color-text-primary)]">{row.data_points.toLocaleString()}</span>
                <span className="num font-bold text-[color:var(--color-text-primary)]">රු {formatCurrency(row.avg_price_lkr)}</span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--chili-600)]">
                  Details <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )
      ) : !visibleItems.length ? (
        <EmptyState
          title="No price row matches that search"
          description="Try a broader item name or switch between retail, market, and history views."
          actionLabel="Clear search"
          actionTo="/prices"
          secondaryActionLabel="Open trends"
          secondaryActionTo="/intelligence"
        />
      ) : (
        <div className="overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)]">
          <div className="hidden grid-cols-[56px_64px_1.2fr_0.72fr_0.65fr_0.75fr_auto] border-b border-[color:var(--color-text-primary)] bg-[color:var(--color-bg-secondary)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-text-muted)] md:grid">
            <span>No.</span>
            <span aria-hidden="true" />
            <span>Item</span>
            <span>Signal</span>
            <span>Sources</span>
            <span>Price</span>
            <span>Open</span>
          </div>
          {visibleItems.map((item, index) => (
            <Link
              key={`${item.kind}-${item.slug}-${item.category}-${item.unit ?? 'unit'}-${index}`}
              to={`/items/${item.slug}`}
              className="grid gap-3 border-b border-dotted border-[color:var(--color-border-hover)] px-4 py-4 last:border-b-0 md:grid-cols-[56px_64px_1.2fr_0.72fr_0.65fr_0.75fr_auto] md:items-center"
            >
              <span className="num font-mono text-xs text-[color:var(--color-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
              <FoodItemImage
                src={item.image_url}
                name={item.display_name || item.canonical_name}
                category={item.category}
                source={item.kind === 'retail' ? item.sources?.[0] : undefined}
                className="h-16 w-16"
              />
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-semibold text-[color:var(--color-text-primary)]">
                  {item.display_name || item.canonical_name}
                </span>
                <span className="block truncate text-sm text-[color:var(--color-text-muted)]">
                  {item.category} · updated {formatCompactDate(item.latest_updated_at)}
                </span>
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-secondary)]">
                {item.kind === 'retail' ? 'Retail offer' : 'Market quote'}
              </span>
              <span className="num font-bold text-[color:var(--color-text-primary)]">
                {item.kind === 'retail' ? item.source_count ?? item.sources?.length ?? 0 : item.market_quotes_count ?? 0}
              </span>
              <span className="num text-lg font-bold text-[color:var(--color-text-primary)]">
                {itemPrice(item) == null ? '-' : <>රු {formatCurrency(itemPrice(item))}</>}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--chili-600)]">
                Details <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}

      <AlertSignup
        compact
        defaultScope="category"
        defaultScopeValue={search || visibleItems[0]?.category || 'grocery'}
        title="Watch this price area"
        subtitle="Save a category or district alert from the price workspace. FoodLK will state clearly if the subscription is saved in preview mode."
      />
    </section>
  )
}
