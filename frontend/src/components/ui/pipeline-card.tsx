import { BarChart3, TimerReset, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { formatCompactDate } from '../../lib/format'
import type { PipelineItem } from '../../types'
import { cn } from '../../lib/utils'

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-emerald-400',
    completed: 'bg-emerald-400',
    running: 'bg-orange-400',
    failed: 'bg-red-400',
    error: 'bg-red-400',
  }
  const colour = map[status.toLowerCase()] ?? 'bg-[#737373]'
  return <span className={cn('inline-block h-2 w-2 rounded-full', colour)} />
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'success' || s === 'completed')
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (s === 'failed' || s === 'error')
    return <XCircle className="h-4 w-4 text-red-400" />
  return <Clock className="h-4 w-4 text-orange-400" />
}

export function PipelineCard({ item }: { item: PipelineItem }) {
  const statusLow = item.status.toLowerCase()
  const isHealthy = statusLow === 'success' || statusLow === 'completed'
  const isError = statusLow === 'failed' || statusLow === 'error'

  const healthPct =
    item.items_seen > 0 ? Math.round((item.items_stored / item.items_seen) * 100) : 0

  return (
    <article className="premium-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={item.status} />
            <h3 className="text-base font-semibold text-[#f5f5f5] truncate">{item.source}</h3>
          </div>
          <p className="mt-1 text-xs text-[#737373]">{formatCompactDate(item.finished_at)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusIcon status={item.status} />
          <span
            className={cn(
              'inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1',
              isHealthy
                ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25'
                : isError
                ? 'bg-red-500/15 text-red-400 ring-red-500/25'
                : 'bg-orange-500/15 text-orange-400 ring-orange-500/25'
            )}
          >
            {item.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div
        className="mt-4 grid grid-cols-2 gap-2 border-t pt-4"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="rounded-md bg-[#161616] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#737373]">
            <BarChart3 className="h-3.5 w-3.5" />
            Seen
          </div>
          <p className="num mt-1.5 text-xl font-semibold text-[#f5f5f5]">{item.items_seen.toLocaleString()}</p>
        </div>
        <div className="rounded-md bg-[#161616] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[#737373]">
            <TimerReset className="h-3.5 w-3.5" />
            Stored
          </div>
          <p className="num mt-1.5 text-xl font-semibold text-[#f5f5f5]">{item.items_stored.toLocaleString()}</p>
        </div>
      </div>

      {/* Health bar */}
      {item.items_seen > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-[#737373]">Ingest rate</p>
            <p className="num text-xs text-[#a3a3a3]">{healthPct}%</p>
          </div>
          <div className="h-1 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                healthPct >= 80 ? 'bg-emerald-500' : healthPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${healthPct}%` }}
            />
          </div>
        </div>
      )}

      {item.error_message && (
        <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400 ring-1 ring-red-500/20">
          {item.error_message}
        </p>
      )}
    </article>
  )
}
