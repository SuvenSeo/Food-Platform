import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { Badge } from '../components/ui/badge'
import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useLocale } from '../hooks/use-locale'
import { api, type PriceChangeItem } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

function movementLabel(item: PriceChangeItem) {
  if (item.delta_vs_median_pct != null) {
    return `${item.delta_vs_median_pct > 0 ? '+' : ''}${item.delta_vs_median_pct.toFixed(1)}% vs median`
  }
  if (item.delta_lkr != null) {
    return `${item.delta_lkr > 0 ? '+' : ''}Rs ${formatCurrency(item.delta_lkr)}`
  }
  if (item.delta_pct != null) {
    return `${item.delta_pct > 0 ? '+' : ''}${item.delta_pct.toFixed(1)}%`
  }
  return item.direction
}

function DirectionStamp({ item }: { item: PriceChangeItem }) {
  const direction = item.direction.toLowerCase()
  const isUp = direction === 'up'
  const isDown = direction === 'down'
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus

  return (
    <div
      className={[
        'flex h-14 w-14 shrink-0 items-center justify-center border-2 bg-[color:var(--color-bg-card)]',
        isUp ? 'border-[color:var(--chili-500)] text-[color:var(--chili-600)]' : '',
        isDown ? 'border-[color:var(--curry-leaf)] text-[color:var(--curry-leaf)]' : '',
        !isUp && !isDown ? 'border-[color:var(--color-border-strong)] text-[color:var(--color-text-muted)]' : '',
      ].join(' ')}
      aria-label={`Price movement ${direction}`}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
  )
}

export function ChangesPage() {
  const { t } = useLocale()
  const changesQuery = useQuery({
    queryKey: ['price-changes'],
    queryFn: () => api.getPriceChanges(40),
  })

  const items = changesQuery.data?.items ?? []
  const upCount = items.filter((item) => item.direction.toLowerCase() === 'up').length
  const downCount = items.filter((item) => item.direction.toLowerCase() === 'down').length
  const unchangedCount = Math.max(items.length - upCount - downCount, 0)

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Revision feed"
        title={t('nav.changes')}
        description="A flip-board of today’s movers: every row reads like a price-tape receipt with source, timestamp, and direction."
      />

      {changesQuery.isError && (
        <ErrorState
          title="Changes feed unavailable"
          message="Could not load recent price movements."
          onRetry={() => changesQuery.refetch()}
        />
      )}

      {changesQuery.isLoading && <SectionSkeleton cards={6} />}

      {!changesQuery.isLoading && !changesQuery.isError && items.length === 0 && (
        <EmptyState
          title="No movements yet"
          description="Run retail and market sync jobs to populate revision events."
        />
      )}

      {!changesQuery.isLoading && items.length > 0 && (
        <>
          <div className="grid gap-[1px] bg-[color:var(--color-border)] md:grid-cols-3">
            {[
              { label: 'Up today', value: upCount, tone: 'text-[color:var(--chili-600)]' },
              { label: 'Down today', value: downCount, tone: 'text-[color:var(--curry-leaf)]' },
              { label: 'Flat / new', value: unchangedCount, tone: 'text-[color:var(--color-text-primary)]' },
            ].map((stat) => (
              <div key={stat.label} className="bg-[color:var(--color-bg-card)] p-5">
                <p className="text-kicker">{stat.label}</p>
                <p className={`num mt-2 text-4xl font-bold ${stat.tone}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <ol className="grid gap-3">
            {items.map((item, index) => {
              const direction = item.direction.toLowerCase()
              return (
                <li
                  key={`${item.kind}-${item.label}-${item.observed_at ?? index}`}
                  className="group grid gap-4 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-4 shadow-paper transition hover:-translate-y-0.5 hover:border-[color:var(--color-border-strong)] md:grid-cols-[auto_1fr_auto]"
                >
                  <DirectionStamp item={item} />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                        {String(index + 1).padStart(2, '0')} · {item.kind === 'retail_offer' ? 'Retail' : 'Market'}
                      </span>
                      <Badge variant={direction === 'down' ? 'green' : direction === 'up' ? 'red' : 'neutral'}>
                        {movementLabel(item)}
                      </Badge>
                    </div>
                    <h3 className="mt-2 truncate font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
                      {item.label}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                      {item.kind === 'retail_offer' ? item.source : `${item.district ?? item.source} · ${item.source}`}
                      {item.observed_at ? ` · ${formatCompactDate(item.observed_at)}` : ''}
                    </p>
                  </div>

                  <div className="border-t border-dotted border-[color:var(--color-border-hover)] pt-3 md:block md:border-l md:border-t-0 md:pl-5 md:pt-0 md:text-right">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                      Board price
                    </p>
                    <p className="num mt-1 text-2xl font-bold text-[color:var(--color-text-primary)]">
                      රු {formatCurrency(item.price_lkr)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>

          <NextActionLinks
            title="Turn the page"
            links={[
              { label: 'Compare districts', to: '/compare' },
              { label: 'Build a basket', to: '/basket' },
              { label: 'Inspect pipeline', to: '/pipeline' },
            ]}
          />
        </>
      )}
    </section>
  )
}
