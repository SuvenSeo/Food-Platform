import { Link } from 'react-router-dom'

import { useIntelligenceSummary } from '../../hooks/use-intelligence-summary'
import { formatCurrency } from '../../lib/format'

export function MobileMoversStrip() {
  const { data } = useIntelligenceSummary()
  const top = data?.rankings.top_value?.[0]

  if (!top) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t-2 border-[color:var(--ink-900)] bg-[color:var(--paper-50)] px-4 py-3 sm:hidden">
      <div className="min-w-0">
        <p className="text-kicker">§ Top value</p>
        <p className="truncate font-display text-[15px] font-semibold text-[color:var(--ink-900)]">{top.display_name}</p>
        <p className="num text-[20px] font-bold text-[color:var(--ink-900)]">
          <span className="text-[12px] font-semibold text-[color:var(--ink-500)]">රු </span>{formatCurrency(top.price_lkr)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Link to="/prices" className="bg-[color:var(--ink-900)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--paper-50)]">
          Prices →
        </Link>
        <Link
          to="/intelligence"
          className="border border-[rgba(14,14,12,0.28)] px-3 py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--ink-900)]"
        >
          Intel →
        </Link>
      </div>
    </div>
  )
}
