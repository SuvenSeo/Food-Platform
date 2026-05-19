import { BarChart3, TimerReset, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatCompactDate } from '../../lib/format'
import type { PipelineItem } from '../../types'
import { cn } from '../../lib/utils'

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: 'bg-emerald-400',
    completed: 'bg-emerald-400',
    healthy: 'bg-emerald-400',
    running: 'bg-orange-400',
    stale: 'bg-amber-400',
    empty: 'bg-amber-400',
    missing: 'bg-red-400',
    failed: 'bg-red-400',
    error: 'bg-red-400',
  }
  const colour = map[status.toLowerCase()] ?? 'bg-[#737373]'
  return <span className={cn('inline-block h-2 w-2 rounded-full', colour)} />
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === 'success' || s === 'completed' || s === 'healthy')
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (s === 'failed' || s === 'error' || s === 'missing')
    return <XCircle className="h-4 w-4 text-red-400" />
  return <Clock className="h-4 w-4 text-orange-400" />
}

export function PipelineCard({ item }: { item: PipelineItem }) {
  const statusLow = item.status.toLowerCase()
  const isHealthy = statusLow === 'success' || statusLow === 'completed' || statusLow === 'healthy'
  const isError = statusLow === 'failed' || statusLow === 'error' || statusLow === 'missing'

  const healthPct =
    item.items_seen > 0 ? Math.round((item.items_stored / item.items_seen) * 100) : 0
  const sourceLabel = item.label || item.source
  const typeLabel = item.source_type ? `${item.source_type} source` : 'source'

  return (
    <motion.article 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="premium-surface p-5 rounded-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot status={item.status} />
            <h3 className="text-base font-semibold tracking-tight text-foreground truncate">{sourceLabel}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {typeLabel} · {formatCompactDate(item.finished_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusIcon status={item.status} />
          <span
            className={cn(
              'inline-flex items-center rounded-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1',
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
        <div className="rounded-xl bg-surface-elevated p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Seen
          </div>
          <p className="num mt-1.5 text-xl font-semibold tracking-tighter text-foreground">{item.items_seen.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-surface-elevated p-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TimerReset className="h-3.5 w-3.5" />
            Records
          </div>
          <p className="num mt-1.5 text-xl font-semibold tracking-tighter text-foreground">{(item.records_count ?? item.items_stored).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <p>Min rows {item.minimum_rows ?? 1}</p>
        <p className="text-right">Stale after {item.stale_after_minutes ?? 0}m</p>
      </div>

      {/* Health bar */}
      {item.items_seen > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Ingest rate</p>
            <p className="num text-xs font-medium tracking-tight text-secondary-foreground">{healthPct}%</p>
          </div>
          <div className="h-1 w-full rounded-full bg-surface-elevated overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${healthPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className={cn(
                'h-full rounded-full',
                healthPct >= 80 ? 'bg-emerald-500' : healthPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
              )}
            />
          </div>
        </div>
      )}

      {item.error_message && (
        <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
          {item.error_message}
        </p>
      )}
    </motion.article>
  )
}
