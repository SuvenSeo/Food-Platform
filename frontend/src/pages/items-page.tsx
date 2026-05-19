import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ImageOff, Search, TrendingUp } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

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
  const items = (itemsQuery.data?.items ?? []).filter((item) => (kind === 'all' ? true : item.kind === kind))

  return (
    <section className="space-y-10">
      <SectionHeader
        eyebrow="All Items"
        title="Price catalog"
        description="A simple searchable index of scraped retail products and public-market items, with product photos where the source provides them."
      />

      <div className="grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 md:grid-cols-[1.4fr_0.6fr]">
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
        <label className="space-y-2">
          <span className="text-kicker">View</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className="fp-select">
            <option value="all">Retail + market</option>
            <option value="retail">Retail products</option>
            <option value="market">Public-market items</option>
          </select>
        </label>
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
        <div className="grid gap-[1px] bg-[color:var(--color-border)] md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={`${item.kind}-${item.slug}-${item.unit ?? 'unit'}`}
              to={`/items/${item.slug}`}
              className="group grid grid-cols-[96px_1fr] bg-[color:var(--color-bg-card)] text-[color:var(--color-text-primary)] transition hover:bg-[color:var(--color-bg-card-hover)]"
            >
              <div className="flex aspect-square items-center justify-center border-r border-[color:var(--color-border)] bg-[color:var(--paper-200)]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.display_name || item.canonical_name}
                    className="h-full w-full object-contain p-2 transition group-hover:scale-[1.04]"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-[color:var(--ink-400)]">
                    <ImageOff className="h-5 w-5" aria-hidden="true" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em]">{item.kind}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 p-4">
                <p className="text-kicker">{item.kind === 'retail' ? `${item.source_count ?? 0} retail sources` : `${item.market_quotes_count ?? 0} market quotes`}</p>
                <h2 className="mt-2 line-clamp-2 font-display text-lg font-semibold leading-tight">
                  {item.display_name || item.canonical_name}
                </h2>
                <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  {item.category} · {item.unit_amount ?? 1} {item.unit ?? 'unit'}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="num text-2xl font-bold">
                    <span className="text-xs text-[color:var(--color-text-muted)]">රු </span>
                    {formatCurrency(item.lowest_price_lkr ?? item.median_price_lkr ?? item.average_market_price_lkr)}
                  </p>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--chili-500)]">
                    details <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                  Updated {formatCompactDate(item.latest_updated_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
