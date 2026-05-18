import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { Badge } from '../components/ui/badge'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { useLocale } from '../hooks/use-locale'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === 'up') return <ArrowUpRight className="h-4 w-4 text-red-400" aria-hidden="true" />
  if (direction === 'down') return <ArrowDownRight className="h-4 w-4 text-emerald-400" aria-hidden="true" />
  return <Minus className="h-4 w-4 text-muted" aria-hidden="true" />
}

export function ChangesPage() {
  const { t } = useLocale()
  const changesQuery = useQuery({
    queryKey: ['price-changes'],
    queryFn: () => api.getPriceChanges(40),
  })

  const items = changesQuery.data?.items ?? []

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Revision feed"
        title={t('nav.changes')}
        description="Recent retail offer shifts and wet-market quote revisions from normalized data."
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
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={`${item.kind}-${item.label}-${item.observed_at ?? index}`}
              className="fp-panel flex flex-wrap items-center justify-between gap-3 rounded-shell border px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <DirectionIcon direction={item.direction} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{item.label}</p>
                  <p className="text-xs text-muted">
                    {item.kind === 'retail_offer' ? `Retail · ${item.source}` : `Market · ${item.district ?? item.source}`}
                    {item.observed_at ? ` · ${formatCompactDate(item.observed_at)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatCurrency(item.price_lkr)}
                </span>
                <Badge variant={item.direction === 'down' ? 'green' : item.direction === 'up' ? 'amber' : 'neutral'}>
                  {item.delta_vs_median_pct != null
                    ? `${item.delta_vs_median_pct > 0 ? '+' : ''}${item.delta_vs_median_pct.toFixed(1)}% vs median`
                    : item.delta_lkr != null
                      ? `${item.delta_lkr > 0 ? '+' : ''}${formatCurrency(item.delta_lkr)}`
                      : item.direction}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
