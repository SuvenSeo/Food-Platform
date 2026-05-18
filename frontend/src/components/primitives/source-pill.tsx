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
        'inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold capitalize transition-all',
        active
          ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/25'
          : 'border border-border text-muted-foreground hover:border-border-hover hover:text-foreground',
      )}
    >
      {source}
      {count !== undefined && (
        <span className="num rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-foreground">
          {count}
        </span>
      )}
    </Tag>
  )
}
