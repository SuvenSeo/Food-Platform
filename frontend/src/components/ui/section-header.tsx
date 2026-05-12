import { type ReactNode } from 'react'
import { cn } from '../../lib/utils'

type SectionHeaderProps = {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
  titleClassName?: string
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-6', className)}>
      <div className="max-w-3xl">
        <p className="eyebrow-accent">{eyebrow}</p>
        <h2
          className={cn(
            'mt-3 leading-tight text-[#f5f5f5]',
            titleClassName
          )}
          style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            letterSpacing: '-0.03em',
          }}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base leading-7 text-[#737373]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
