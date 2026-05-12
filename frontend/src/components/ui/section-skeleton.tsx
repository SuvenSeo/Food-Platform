import { cn } from '../../lib/utils'

export function SectionSkeleton({
  cards = 3,
  withToolbar = false,
  className = '',
}: {
  cards?: number
  withToolbar?: boolean
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {withToolbar && (
        <div className="fp-toolbar">
          <div className="shimmer h-10 rounded-md md:col-span-2" />
          <div className="shimmer h-10 rounded-md" />
          <div className="shimmer h-10 rounded-md" />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <article
            key={`sk-${i}`}
            className="rounded-card border p-5 space-y-4"
            style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#111111' }}
          >
            <div className="shimmer h-3 w-24 rounded" />
            <div className="shimmer h-5 w-3/4 rounded" />
            <div className="shimmer h-4 w-1/2 rounded" />
            <div className="shimmer h-8 w-32 rounded-pill" />
          </article>
        ))}
      </div>
    </div>
  )
}
