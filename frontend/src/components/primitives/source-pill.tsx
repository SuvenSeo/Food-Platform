import { cn } from '../../lib/utils'

type SourcePillProps = {
  source: string
  active?: boolean
  onClick?: () => void
  count?: number
}

export function SourcePill({ source, active, onClick, count }: SourcePillProps) {
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] transition-all',
        active
          ? 'bg-[color:var(--color-text-primary)] text-[color:var(--paper-50)]'
          : 'border border-[color:var(--color-border-hover)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-text-primary)] hover:text-[color:var(--color-text-primary)]',
      )}
    >
      {source}
      {count !== undefined && (
        <span className={cn(
          'num text-[10px] font-bold',
          active ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-muted)]',
        )}>
          /{count}
        </span>
      )}
    </Tag>
  )
}
