import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Bookmark, Trash2, Search, ArrowUpRight } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { EmptyState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useWatchlists } from '../hooks/use-watchlists'

const kindVariant: Record<string, 'orange' | 'teal' | 'neutral'> = {
  basket: 'orange',
  compare: 'teal',
  offer: 'neutral',
}

export function WatchlistsPage() {
  const { entries, clearEntries } = useWatchlists()
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const kinds = useMemo(() => Array.from(new Set(entries.map((e) => e.kind))).sort(), [entries])
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
        title="Saved views"
        description="Keep your recurring basket, compare, and offer workflows in one place so analysis sessions can resume instantly."
      />

      {entries.length === 0 ? (
        <div className="fp-panel flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.07)' }}>
            <Bookmark className="h-7 w-7 text-orange-400" />
          </div>
          <h3
            className="text-[#f5f5f5]"
            style={{ fontFamily: '"DM Serif Display", serif', fontSize: '1.5rem', letterSpacing: '-0.03em' }}
          >
            No saved views yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[#737373]">
            Save a basket preset, compare pair, or offer detail and it will appear here.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/basket" className="fp-button-primary">Open basket</Link>
            <Link to="/compare" className="fp-button-secondary">Try compare</Link>
          </div>
        </div>
      ) : (
        <div className="fp-panel space-y-6">
          {/* Toolbar */}
          <div className="fp-toolbar md:grid-cols-[1.3fr_1fr_auto] lg:grid-cols-[1.3fr_1fr_auto]">
            <label className="space-y-2">
              <span className="eyebrow-label">Search saved views</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#737373]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="fp-input pl-10"
                  placeholder="Search title or summary"
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="eyebrow-label">Type</span>
              <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="fp-select">
                <option value="all">All types</option>
                {kinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={clearEntries}
              className="mb-0.5 inline-flex items-center gap-2 rounded-pill border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </button>
          </div>

          <RevealSection>
            {!visibleEntries.length ? (
              <EmptyState
                title="No saved views match these filters"
                description="Clear your search or type filter to find more entries."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleEntries.map((entry, i) => (
                  <motion.article
                    key={entry.id}
                    className="premium-card p-5 group"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge variant={kindVariant[entry.kind] ?? 'neutral'}>{entry.kind}</Badge>
                      <Bookmark className="h-4 w-4 text-[#404040] group-hover:text-orange-400 transition-colors" />
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-[#f5f5f5]">{entry.title}</h3>
                    <p className="mt-1 text-sm text-[#737373]">{entry.summary}</p>
                    <div className="mt-5 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                      <Link
                        to={entry.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 transition-colors hover:text-orange-300"
                      >
                        Open view <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </RevealSection>

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
