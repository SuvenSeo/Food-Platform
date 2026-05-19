import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

const destinations = [
  { label: 'Home', to: '/', group: 'Discover' },
  { label: 'Retail offers', to: '/retail', group: 'Discover' },
  { label: 'Market quotes', to: '/markets', group: 'Discover' },
  { label: 'Categories', to: '/categories', group: 'Discover' },
  { label: 'Intelligence desk', to: '/intelligence', group: 'Intelligence' },
  { label: 'Price changes', to: '/changes', group: 'Intelligence' },
  { label: 'Compare districts', to: '/compare', group: 'Tools' },
  { label: 'Basket workspace', to: '/basket', group: 'Tools' },
  { label: 'Watchlists', to: '/watchlists', group: 'Tools' },
  { label: 'Data pipeline', to: '/pipeline', group: 'Trust' },
  { label: 'Methods & trust', to: '/methods', group: 'Trust' },
  { label: 'Developers', to: '/developers', group: 'Trust' },
]

type CommandSearchProps = {
  open: boolean
  onClose: () => void
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return destinations
    return destinations.filter(
      (d) => d.label.toLowerCase().includes(needle) || d.group.toLowerCase().includes(needle),
    )
  }, [query])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-[color:var(--ink-900)]/40 px-4 pt-[10vh] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Jump to section"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden border-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ink masthead bar */}
        <div className="flex items-center justify-between bg-[color:var(--ink-900)] px-4 py-2 text-[color:var(--paper-100)]">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]">§ Jump to section</p>
          <button
            type="button"
            onClick={handleClose}
            className="border border-white/15 p-1 text-[color:var(--paper-300)] transition hover:border-[color:var(--turmeric)] hover:text-[color:var(--turmeric)]"
            aria-label="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-[color:var(--color-border-hover)] px-4 py-3">
          <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a section name…"
            className="flex-1 bg-transparent font-display text-[18px] italic text-[color:var(--color-text-primary)] placeholder:text-[color:var(--color-text-muted)] focus:outline-none"
            style={{ fontVariationSettings: "'opsz' 36" }}
          />
        </div>

        <ul className="max-h-80 overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.to}>
              <button
                type="button"
                className="group flex w-full items-baseline justify-between border-b border-[color:var(--color-border)] px-4 py-3 text-left transition hover:bg-[color:var(--paper-200)]"
                onClick={() => {
                  navigate(item.to)
                  handleClose()
                }}
              >
                <span className="font-display text-[16px] text-[color:var(--color-text-primary)] group-hover:text-[color:var(--chili-500)]"
                  style={{ fontVariationSettings: "'opsz' 36, 'wght' 500" }}>{item.label}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">§ {item.group}</span>
              </button>
            </li>
          ))}
          {!filtered.length && (
            <li className="px-4 py-6 text-center font-display text-[15px] italic text-[color:var(--color-text-muted)]">No matches in this edition</li>
          )}
        </ul>

        <p className="border-t border-[color:var(--color-border-hover)] bg-[color:var(--paper-100)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
          <kbd className="border border-[color:var(--color-border-hover)] bg-[color:var(--paper-50)] px-1.5">Esc</kbd> close ·{' '}
          <kbd className="border border-[color:var(--color-border-hover)] bg-[color:var(--paper-50)] px-1.5">⌘</kbd>
          <kbd className="border border-[color:var(--color-border-hover)] bg-[color:var(--paper-50)] px-1.5">K</kbd> toggle
        </p>
      </div>
    </div>
  )
}

