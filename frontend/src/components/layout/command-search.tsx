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
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Jump to page"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-shell border border-border bg-surface shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to retail, markets, compare…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-72 overflow-y-auto py-2">
          {filtered.map((item) => (
            <li key={item.to}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-white/[0.05]"
                onClick={() => {
                  navigate(item.to)
                  handleClose()
                }}
              >
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.group}</span>
              </button>
            </li>
          ))}
          {!filtered.length && (
            <li className="px-4 py-6 text-center text-sm text-muted-foreground">No matches</li>
          )}
        </ul>
        <p className="border-t border-border px-4 py-2 text-[10px] text-faint">
          <kbd className="rounded bg-white/10 px-1">Esc</kbd> close ·{' '}
          <kbd className="rounded bg-white/10 px-1">Ctrl</kbd>
          <kbd className="rounded bg-white/10 px-1">K</kbd> toggle
        </p>
      </div>
    </div>
  )
}

