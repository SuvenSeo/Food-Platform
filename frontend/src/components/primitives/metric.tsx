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
        'relative flex flex-col gap-3 border p-5 transition-colors',
        highlight
          ? 'border-[color:var(--color-text-primary)] bg-[color:var(--color-text-primary)] text-[color:var(--paper-50)]'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] text-[color:var(--color-text-primary)]',
        className,
      )}
    >
      <p
        className={cn(
          'font-mono text-[10px] font-bold uppercase tracking-[0.22em]',
          highlight ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-muted)]',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'num text-[40px] font-bold leading-[0.95] tracking-[-0.025em]',
          highlight ? 'text-[color:var(--paper-50)]' : 'text-[color:var(--color-text-primary)]',
        )}
      >
        {value}
      </p>
      {helper ? (
        <p
          className={cn(
            'font-display text-[13px] italic leading-[1.4]',
            highlight ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-secondary)]',
          )}
          style={{ fontVariationSettings: "'opsz' 24" }}
        >
          {helper}
        </p>
      ) : null}
    </div>
  )
}
