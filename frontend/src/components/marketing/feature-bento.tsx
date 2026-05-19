import type { ElementType } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '../../lib/utils'

export type FeatureBentoItem = {
  title: string
  description: string
  href: string
  icon: ElementType
  accent?: boolean
}

type FeatureBentoProps = {
  items: FeatureBentoItem[]
  className?: string
}

function BentoCard({ title, description, href, icon: Icon, accent, idx }: FeatureBentoItem & { idx: number }) {
  return (
    <Link
      to={href}
      className={cn(
        'group relative flex h-full flex-col gap-3 border bg-[color:var(--color-bg-card)] p-5 transition-all duration-200',
        'hover:-translate-y-0.5',
        accent
          ? 'border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] hover:bg-[color:var(--paper-100)]'
          : 'border-[color:var(--color-border)] hover:border-[color:var(--color-text-primary)]',
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-kicker">§ Section</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">
          P. {String(idx + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-baseline gap-2.5">
        <Icon className="h-5 w-5 shrink-0 text-[color:var(--chili-500)]" aria-hidden="true" />
        <h3
          className="font-display text-[22px] leading-[1.05] tracking-[-0.025em] text-[color:var(--color-text-primary)]"
          style={{ fontVariationSettings: "'opsz' 48, 'wght' 600" }}
        >
          {title}
        </h3>
      </div>

      <p
        className="font-display text-[14px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
        style={{ fontVariationSettings: "'opsz' 36" }}
      >
        {description}
      </p>

      <div className="mt-auto pt-2">
        <div className="rule-dotted h-px w-full" aria-hidden="true" />
        <span className="mt-3 inline-flex items-baseline gap-1.5 font-display text-[13px] italic text-[color:var(--color-text-primary)] underline decoration-1 underline-offset-[5px] transition-all group-hover:text-[color:var(--chili-500)] group-hover:decoration-[color:var(--chili-500)]">
          read on
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  )
}

export function FeatureBento({ items, className }: FeatureBentoProps) {
  return (
    <div
      className={cn(
        'grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item, idx) => (
        <BentoCard key={item.href} {...item} idx={idx} />
      ))}
    </div>
  )
}
