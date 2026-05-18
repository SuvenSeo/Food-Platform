import { Link } from 'react-router-dom'
import { Activity, Database, Shield } from 'lucide-react'

import type { PlatformFreshnessSummary } from '../../types'
import { formatCompactDate } from '../../lib/format'
import { cn } from '../../lib/utils'

type TrustRibbonProps = {
  freshness: PlatformFreshnessSummary | undefined
  loading?: boolean
  className?: string
}

const gradeStyles = {
  high: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
  medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
  low: 'bg-red-500/15 text-red-400 ring-red-500/25',
} as const

export function TrustRibbon({ freshness, loading, className }: TrustRibbonProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'flex h-9 items-center gap-3 rounded-full border border-border bg-surface-elevated/80 px-4',
          className,
        )}
        aria-hidden="true"
      >
        <span className="h-2 w-24 animate-pulse rounded-full bg-white/10" />
        <span className="h-2 w-16 animate-pulse rounded-full bg-white/10" />
      </div>
    )
  }

  if (!freshness) return null

  const grade = freshness.confidence.grade
  const gradeClass = gradeStyles[grade] ?? gradeStyles.low
  const { healthy_sources, total_sources } = freshness.pipeline

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full border border-border bg-surface-elevated/90 px-4 py-1.5 text-xs backdrop-blur-md',
        className,
      )}
      role="status"
      aria-label="Platform trust and freshness"
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ring-1',
          gradeClass,
        )}
      >
        <Shield className="h-3 w-3" aria-hidden="true" />
        Confidence {freshness.confidence.score}/100
      </span>

      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <Database className="h-3 w-3 text-brand-400" aria-hidden="true" />
        <span className="num text-foreground">{freshness.coverage.offers_count.toLocaleString()}</span> offers
      </span>

      {total_sources > 0 && (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Activity
            className={cn(
              'h-3 w-3',
              healthy_sources === total_sources ? 'text-emerald-400' : 'text-amber-400',
            )}
            aria-hidden="true"
          />
          <span className="num text-foreground">
            {healthy_sources}/{total_sources}
          </span>{' '}
          sources healthy
        </span>
      )}

      <span className="text-faint hidden sm:inline">
        Scraped {formatCompactDate(freshness.freshness.last_scrape_at)}
      </span>

      <Link
        to="/pipeline"
        className="ml-auto hidden font-semibold text-brand-400 transition hover:text-brand-300 sm:inline"
      >
        Pipeline →
      </Link>
    </div>
  )
}
