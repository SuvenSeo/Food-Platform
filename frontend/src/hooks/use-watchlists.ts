import { useCallback, useMemo } from 'react'

import type { WatchlistEntry } from '../types'

const STORAGE_KEY = 'food-platform.watchlists'

function readEntries(): WatchlistEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WatchlistEntry[]
  } catch {
    return []
  }
}

function writeEntries(entries: WatchlistEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function useWatchlists() {
  const entries = useMemo(() => readEntries(), [])

  const saveEntry = useCallback((entry: WatchlistEntry) => {
    const next = [...readEntries().filter((item) => item.id !== entry.id), entry]
    writeEntries(next)
  }, [])

  const clearEntries = useCallback(() => {
    writeEntries([])
  }, [])

  return {
    entries,
    saveEntry,
    clearEntries,
  }
}
