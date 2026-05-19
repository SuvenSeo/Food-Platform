import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_PREFIX = 'food-platform.guidance.'
const STORAGE_EVENT = 'food-platform.guidance.updated'

function keyFor(id: string) {
  return `${STORAGE_PREFIX}${id}`
}

function readDismissed(id: string) {
  if (typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(keyFor(id)) === '1'
  } catch {
    return false
  }
}

function writeDismissed(id: string, dismissed: boolean) {
  if (typeof window === 'undefined') return

  try {
    const key = keyFor(id)
    if (dismissed) {
      window.localStorage.setItem(key, '1')
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Local storage is optional. If it fails, the cue remains session-only.
  }
}

function notifyGuidanceChanged() {
  if (typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith(STORAGE_PREFIX)) callback()
  }
  const onInternalUpdate = () => callback()

  window.addEventListener('storage', onStorage)
  window.addEventListener(STORAGE_EVENT, onInternalUpdate)

  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(STORAGE_EVENT, onInternalUpdate)
  }
}

export function useDismissedGuidance(id: string) {
  const dismissed = useSyncExternalStore(subscribe, () => readDismissed(id), () => false)

  const dismiss = useCallback(() => {
    writeDismissed(id, true)
    notifyGuidanceChanged()
  }, [id])

  const reset = useCallback(() => {
    writeDismissed(id, false)
    notifyGuidanceChanged()
  }, [id])

  return { dismissed, dismiss, reset }
}
