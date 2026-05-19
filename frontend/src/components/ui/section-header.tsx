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

/** Newspaper section opener — kicker, Fraunces title, italic deck, double rule. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  titleClassName,
}: SectionHeaderProps) {
  return (
    <header className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0 max-w-3xl">
          <span className="text-kicker">§ {eyebrow}</span>
          <h2
            className={cn(
              'mt-3 font-display leading-[0.95] text-[color:var(--color-text-primary)]',
              titleClassName,
            )}
            style={{
              fontSize: 'clamp(1.75rem, 3.4vw, 2.75rem)',
              letterSpacing: '-0.035em',
              fontVariationSettings: "'opsz' 96, 'SOFT' 30, 'wght' 600",
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              className="mt-4 max-w-[min(64ch,calc(100vw-3rem))] break-words font-display text-[16px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
              style={{ fontVariationSettings: "'opsz' 36, 'wght' 400" }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="rule-double h-1.5 w-full" aria-hidden="true" />
    </header>
  )
}
