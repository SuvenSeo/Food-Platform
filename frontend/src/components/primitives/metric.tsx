import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

type MetricProps = {
  label: string
  value: ReactNode
  helper?: string
  highlight?: boolean
  className?: string
}

export function Metric({ label, value, helper, highlight, className }: MetricProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface p-5 transition-colors',
        highlight && 'border-brand-500/25 ring-1 ring-brand-500/15',
        className,
      )}
    >
      <p className="eyebrow-label">{label}</p>
      <p
        className={cn(
          'num mt-2 text-3xl font-semibold tracking-tight text-foreground',
          highlight && 'text-brand-400',
        )}
      >
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{helper}</p> : null}
    </div>
  )
}
