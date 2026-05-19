import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ImageOff, LayoutGrid, Search, Store, TrendingUp, Waves } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { WorkflowCue } from '../components/ui/workflow-cue'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'
import type { ItemSummary } from '../types'

function ItemThumb({ item }: { item: ItemSummary }) {
  const [errored, setErrored] = useState(false)
  if (item.image_url && !errored) {
    return (
      <img
        src={item.image_url}
        alt={item.display_name || item.canonical_name}
        className="h-full w-full object-contain p-3 transition group-hover:scale-[1.04]"
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 text-[color:var(--ink-400)]">
      <ImageOff className="h-6 w-6" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{item.kind}</span>
    </div>
  )
}

export function ItemsPage() {
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<'all' | 'retail' | 'market'>('all')
  const params = useMemo(() => {
    const searchParams = new URLSearchParams({ limit: '120' })
    if (search.trim()) searchParams.set('search', search.trim())
    return `?${searchParams.toString()}`
  }, [search])
  const itemsQuery = useQuery({
    queryKey: ['items', params],
    queryFn: () => api.getItems(params),
  })
  const allItems = itemsQuery.data?.items ?? []
  const retailCount = allItems.filter((item) => item.kind === 'retail').length
  const marketCount = allItems.filter((item) => item.kind === 'market').length
  const items = allItems.filter((item) => (kind === 'all' ? true : item.kind === kind))
  const kindOptions = [
    { value: 'all', label: 'All signals', count: allItems.length, icon: LayoutGrid },
    { value: 'retail', label: 'Retail only', count: retailCount, icon: Store },
    { value: 'market', label: 'Market only', count: marketCount, icon: Waves },
  ] as const

  return (
    <section className="space-y-10">
      <SectionHeader
        eyebrow="All Items"
        title="Price catalog"
        description="Search once, then split the result between supermarket products and public-market items before moving into comparison or basket work."
      />

      <WorkflowCue
        id="items-catalog-guidance"
        eyebrow="Catalog path"
        title="Start broad, then narrow by signal type."
        body="Use all signals for discovery, retail when package photos matter, and market when district price movement matters."
        points={['Search item name', 'Choose signal type', 'Open details']}
        actionLabel="Compare districts"
        actionTo="/compare"
        secondaryActionLabel="Build basket"
        secondaryActionTo="/basket"
      />

      <div className="grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="space-y-2">
          <span className="text-kicker">Search item</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="fp-input pl-10"
              placeholder="Rice, dhal, coconut oil, carrot..."
            />
          </div>
        </label>
        <div className="space-y-2">
          <span className="text-kicker">Signal type</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {kindOptions.map(({ value, label, count, icon: Icon }) => (
              <button
                key={value}
                type="button"
                data-active={kind === value}
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
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

      <div className="grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-3">
        {[
          { label: 'Visible results', value: items.length },
          { label: 'Retail products', value: retailCount },
          { label: 'Market items', value: marketCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-[color:var(--color-bg-card)] p-4">
            <p className="text-kicker">{stat.label}</p>
            <p className="num mt-2 text-2xl font-bold text-[color:var(--color-text-primary)]">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {itemsQuery.isError ? (
        <ErrorState message="Unable to load the item catalog right now." onRetry={() => itemsQuery.refetch()} />
      ) : itemsQuery.isLoading ? (
        <SectionSkeleton cards={8} />
      ) : !items.length ? (
        <EmptyState
          title="No item matches that search"
          description="Try a broader item name or switch between retail and market items."
          actionLabel="Open retail board"
          actionTo="/retail"
        />
      ) : (
        <div className="grid gap-[1px] bg-[color:var(--color-border)] lg:grid-cols-2">
          {items.map((item, index) => (
            <Link
              key={`${item.kind}-${item.slug}-${item.category}-${item.unit ?? 'unit'}-${item.best_offer_id ?? item.market_quotes_count ?? 'row'}-${index}`}
              to={`/items/${item.slug}`}
              className="catalog-result-card group grid min-h-[148px] grid-cols-[116px_minmax(0,1fr)] bg-[color:var(--color-bg-card)] text-[color:var(--color-text-primary)] transition hover:bg-[color:var(--color-bg-card-hover)] sm:min-h-[168px] sm:grid-cols-[148px_minmax(0,1fr)]"
            >
              <div className="flex aspect-square items-center justify-center border-r border-[color:var(--color-border)] bg-[color:var(--paper-200)]">
                <ItemThumb item={item} />
              </div>
              <div className="flex min-w-0 flex-col justify-between p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-kicker">{item.kind === 'retail' ? `${item.source_count ?? 0} retail sources` : `${item.market_quotes_count ?? 0} market quotes`}</p>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
                    {item.kind === 'retail' ? 'Retail' : 'Market'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="mt-2 line-clamp-2 font-display text-xl font-semibold leading-tight text-[color:var(--color-text-primary)] sm:text-[22px]">
                    {item.display_name || item.canonical_name}
                  </h2>
                  <p className="mt-2 truncate font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                    {item.category} · {item.unit_amount ?? 1} {item.unit ?? 'unit'}
                  </p>
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="num text-[30px] font-bold leading-none sm:text-[34px]">
                      <span className="text-sm text-[color:var(--color-text-muted)]">රු </span>
                      {formatCurrency(item.lowest_price_lkr ?? item.median_price_lkr ?? item.average_market_price_lkr)}
                    </p>
                    <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
                      Updated {formatCompactDate(item.latest_updated_at)}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--chili-500)]">
                    details <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
