import { Link } from 'react-router-dom'

import { SectionHeader } from '../components/ui/section-header'
import { useWatchlists } from '../hooks/use-watchlists'

export function WatchlistsPage() {
  const { entries, clearEntries } = useWatchlists()

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Watchlists"
        title="Watchlists"
        description="Saved views for repeated basket, compare, and category workflows. This first version uses local browser persistence."
      />

      {entries.length === 0 ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <p className="text-base leading-7 text-slate-600">No saved views yet. Save a basket preset or compare view to reuse it later.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearEntries}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Clear watchlists
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {entries.map((entry) => (
              <article key={entry.id} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{entry.kind}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{entry.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>
                <Link to={entry.href} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  Open view
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
