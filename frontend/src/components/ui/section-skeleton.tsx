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
    <div className={`space-y-4 ${className}`}>
      {withToolbar ? (
        <div className="fp-toolbar animate-pulse">
          <div className="h-10 rounded-2xl bg-slate-200/70 md:col-span-2" />
          <div className="h-10 rounded-2xl bg-slate-200/70" />
          <div className="h-10 rounded-2xl bg-slate-200/70" />
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }).map((_, index) => (
          <article key={`skeleton-${index}`} className="fp-card animate-pulse space-y-4">
            <div className="h-3 w-24 rounded bg-slate-200/70" />
            <div className="h-5 w-3/4 rounded bg-slate-200/70" />
            <div className="h-4 w-1/2 rounded bg-slate-200/70" />
            <div className="h-10 w-40 rounded bg-slate-200/70" />
          </article>
        ))}
      </div>
    </div>
  )
}
