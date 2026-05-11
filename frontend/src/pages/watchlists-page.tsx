import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'

export function WatchlistsPage() {
  const { entries, clearEntries } = useWatchlists()
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const kinds = useMemo(() => Array.from(new Set(entries.map((entry) => entry.kind))).sort(), [entries])
  const visibleEntries = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const matchesKind = kindFilter === 'all' ? true : entry.kind === kindFilter
      const matchesSearch = `${entry.title} ${entry.summary}`.toLowerCase().includes(needle)
      return matchesKind && matchesSearch
    })
  }, [entries, kindFilter, search])

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Watchlists"
        title="Watchlists"
        description="Keep your recurring basket, compare, and offer workflows in one place so analysis sessions can resume instantly."
      />

      {entries.length === 0 ? (
        <div className="fp-panel">
          <EmptyState
            title="No saved views yet"
            description="Save a basket preset, compare pair, or offer detail and it will appear here."
            actionLabel="Open basket workspace"
            actionTo="/basket"
          />
        </div>
      ) : (
        <div className="fp-panel space-y-6">
          <div className="fp-toolbar md:grid-cols-[1.3fr_1fr_auto] lg:grid-cols-[1.3fr_1fr_auto]">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Search saved views</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="fp-input"
                placeholder="Search title or summary"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Type</span>
              <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value)} className="fp-select">
                <option value="all">All types</option>
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={clearEntries}
              className="fp-button-secondary self-end"
            >
              Clear watchlists
            </button>
          </div>

          {!visibleEntries.length ? (
            <EmptyState
              title="No saved views match these filters"
              description="Clear your search or type filter to find more entries."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visibleEntries.map((entry) => (
                <article key={entry.id} className="fp-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{entry.kind}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{entry.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>
                  <Link to={entry.href} className="fp-button-primary mt-4">
                    Open view
                  </Link>
                </article>
              ))}
            </div>
          )}

          <NextActionLinks
            title="Next actions"
            links={[
              { label: 'Save new basket', to: '/basket' },
              { label: 'Save new compare view', to: '/compare' },
              { label: 'Browse retail offers', to: '/retail' },
            ]}
          />
        </div>
      )}
    </section>
  )
}
