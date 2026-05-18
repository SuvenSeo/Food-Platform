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

function BentoCard({ title, description, href, icon: Icon, accent }: FeatureBentoItem) {
  return (
    <Link
      to={href}
      className={cn(
        'group relative block h-full overflow-hidden rounded-card rounded-tr-[22px] border border-border bg-surface p-5 transition-all duration-200',
        'hover:-translate-y-1 hover:border-border-hover hover:shadow-elevated',
        'before:absolute before:right-0 before:top-0 before:z-[2] before:h-6 before:w-6',
        'before:-translate-y-1.5 before:translate-x-1.5 before:rotate-45 before:bg-background before:shadow-[0_1px_0_0_var(--color-border)]',
        'after:absolute after:right-0 after:top-0 after:z-[1] after:h-5 after:w-5 after:rounded-bl-md after:border after:border-border after:bg-background',
        accent && 'border-brand-500/20 bg-gradient-to-br from-brand-500/[0.06] to-transparent',
      )}
    >
      <div className="relative flex items-center gap-2">
        <span className="absolute -left-5 h-5 w-[3px] rounded-r-sm bg-brand-500" aria-hidden="true" />
        <Icon className="h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  )
}

export function FeatureBento({ items, className }: FeatureBentoProps) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <BentoCard key={item.href} {...item} />
      ))}
    </div>
  )
}
