import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, DatabaseZap, RefreshCcw } from 'lucide-react'

import type { PlatformFreshnessSummary } from '../../types'
import { formatCompactDate } from '../../lib/format'
import { cn } from '../../lib/utils'

type TrustCommandRailProps = {
  freshness?: PlatformFreshnessSummary
  loading?: boolean
}

function gradeLabel(grade?: string) {
  if (grade === 'high') return 'Current window'
  if (grade === 'medium') return 'Watch mode'
  return 'Needs review'
}

function gradeTone(grade?: string) {
  if (grade === 'high') return 'text-[color:var(--curry-leaf)]'
  if (grade === 'medium') return 'text-[color:var(--turmeric-deep)]'
  return 'text-[color:var(--chili-600)]'
}

export function TrustCommandRail({ freshness, loading = false }: TrustCommandRailProps) {
  const confidence = freshness?.confidence
  const pipeline = freshness?.pipeline
  const warnings = pipeline?.blocking_warnings ?? []
  const healthy = pipeline?.healthy_sources ?? 0
  const total = pipeline?.total_sources ?? 0
  const lastScrape = freshness?.freshness.last_scrape_at

  return (
    <aside className="trust-command-rail" aria-label="Platform trust and quick actions: source freshness and reference links">
      <div className="mx-auto grid max-w-[1320px] gap-[1px] bg-[color:var(--color-border)] px-4 sm:px-6 lg:grid-cols-[1fr_0.82fr_1.15fr]">
        <div className="trust-command-cell bg-[color:var(--paper-50)]">
          <span className="text-kicker">§ Trust window</span>
          <div className="mt-2 flex items-center gap-2">
            {confidence?.grade === 'high' ? (
              <CheckCircle2 className="h-4 w-4 text-[color:var(--curry-leaf)]" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[color:var(--chili-600)]" aria-hidden="true" />
            )}
            <p className={cn('font-display text-base font-semibold leading-none', gradeTone(confidence?.grade))}>
              {loading ? 'Checking' : gradeLabel(confidence?.grade)}
            </p>
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--ink-500)]">
            {confidence?.note ?? 'Checking scheduled refreshes and source coverage.'}
          </p>
        </div>

        <div className="trust-command-cell bg-[color:var(--paper-50)]">
          <span className="text-kicker">§ Source freshness</span>
          <p className="num mt-2 text-xl font-bold leading-none text-[color:var(--ink-900)]">
            {healthy}/{total || '—'}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--ink-500)]">
            feeds healthy · scheduled refresh {formatCompactDate(lastScrape)}
          </p>
        </div>

        <div className="trust-command-cell bg-[color:var(--paper-50)]">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-kicker">§ Reference</span>
              <p className="mt-2 text-sm leading-6 text-[color:var(--ink-700)]">
                {warnings.length
                  ? `${warnings.length} expected feeds need attention before publishing analysis.`
                  : 'All expected feeds are within the current trust window.'}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2 sm:shrink-0">
              <Link to="/pipeline" className="rail-action" aria-label="Pipeline source status">
                <DatabaseZap className="h-3.5 w-3.5" aria-hidden="true" />
                Sources
              </Link>
              <Link to="/methods" className="rail-action">
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Methods
              </Link>
              <Link to="/developers" className="rail-action">
                API
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
