import { Link } from 'react-router-dom'

import { useIntelligenceSummary } from '../../hooks/use-intelligence-summary'
import { formatCurrency } from '../../lib/format'

export function MobileMoversStrip() {
  const { data } = useIntelligenceSummary()
  const top = data?.rankings.top_value?.[0]

  if (!top) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:hidden">
      <div className="min-w-0">
        <p className="eyebrow-label">Top value now</p>
        <p className="truncate text-sm font-semibold text-foreground">{top.display_name}</p>
        <p className="num text-lg font-bold text-brand-400">
          Rs {formatCurrency(top.price_lkr)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Link to="/retail" className="rounded-pill bg-brand-500 px-3 py-2 text-xs font-semibold text-black">
          Retail
        </Link>
        <Link
          to="/intelligence"
          className="rounded-pill border border-border px-3 py-2 text-xs font-semibold text-foreground"
        >
          Intel
        </Link>
      </div>
    </div>
  )
}
