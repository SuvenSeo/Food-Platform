import { useCallback, useSyncExternalStore } from 'react'

import type { WatchlistEntry } from '../types'

const STORAGE_KEY = 'food-platform.watchlists'
const STORAGE_EVENT = 'food-platform.watchlists.updated'
const EMPTY_ENTRIES: WatchlistEntry[] = []

let cachedRaw: string | null = null
let cachedEntries: WatchlistEntry[] = EMPTY_ENTRIES

function isWatchlistEntry(value: unknown): value is WatchlistEntry {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.href === 'string' &&
    typeof candidate.summary === 'string'
  )
}

function readEntries(): WatchlistEntry[] {
  if (typeof window === 'undefined') return EMPTY_ENTRIES

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === cachedRaw) return cachedEntries
    if (!raw) {
      cachedRaw = raw
      cachedEntries = EMPTY_ENTRIES
      return cachedEntries
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      cachedRaw = raw
      cachedEntries = EMPTY_ENTRIES
      return cachedEntries
    }
    cachedRaw = raw
    cachedEntries = parsed.filter(isWatchlistEntry)
    return cachedEntries
  } catch {
    cachedRaw = null
    cachedEntries = EMPTY_ENTRIES
    return cachedEntries
  }
}

function writeEntries(entries: WatchlistEntry[]) {
  if (typeof window === 'undefined') return
  const serialized = JSON.stringify(entries)
  cachedRaw = serialized
  cachedEntries = entries
  window.localStorage.setItem(STORAGE_KEY, serialized)
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      callback()
    }
  }
  const onInternalUpdate = () => {
    callback()
  }

  window.addEventListener('storage', onStorage)
  window.addEventListener(STORAGE_EVENT, onInternalUpdate)

  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(STORAGE_EVENT, onInternalUpdate)
  }
}

export function useWatchlists() {
  const entries = useSyncExternalStore(subscribe, readEntries, () => EMPTY_ENTRIES)

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
