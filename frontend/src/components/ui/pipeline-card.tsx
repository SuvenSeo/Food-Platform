import { BarChart3, TimerReset } from 'lucide-react'

import { formatCompactDate } from '../../lib/format'
import type { PipelineItem } from '../../types'

export function PipelineCard({ item }: { item: PipelineItem }) {
  return (
    <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{item.source}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatCompactDate(item.finished_at)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {item.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Seen
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-950">{item.items_seen}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <TimerReset className="h-4 w-4" />
            Stored
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-950">{item.items_stored}</p>
        </div>
      </div>
      {item.error_message ? <p className="mt-3 text-sm text-red-600">{item.error_message}</p> : null}
    </article>
  )
}
