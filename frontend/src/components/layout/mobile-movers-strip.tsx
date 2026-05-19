import { Link } from 'react-router-dom'

import { useIntelligenceSummary } from '../../hooks/use-intelligence-summary'
import { formatCurrency } from '../../lib/format'

export function MobileMoversStrip() {
  const { data } = useIntelligenceSummary()
  const top = data?.rankings.top_value?.[0]

  if (!top) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] px-4 py-3 sm:hidden">
      <div className="min-w-0">
        <p className="text-kicker">§ Top value</p>
        <p className="truncate font-display text-[15px] font-semibold text-[color:var(--color-text-primary)]">{top.display_name}</p>
        <p className="num text-[20px] font-bold text-[color:var(--color-text-primary)]">
          <span className="text-[12px] font-semibold text-[color:var(--color-text-muted)]">රු </span>{formatCurrency(top.price_lkr)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <Link to="/retail" className="bg-[color:var(--color-text-primary)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--paper-50)]">
          Retail →
        </Link>
        <Link
          to="/intelligence"
          className="border border-[color:var(--color-border-hover)] px-3 py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-text-primary)]"
        >
          Intel →
        </Link>
      </div>
    </div>
  )
}
