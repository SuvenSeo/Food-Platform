import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'

function createStorageShim() {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, String(value)) }),
    removeItem: vi.fn((key: string) => { store.delete(key) }),
    clear: vi.fn(() => { store.clear() }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
      return store.size
    },
  }
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: createStorageShim(),
    configurable: true,
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: createStorageShim(),
    configurable: true,
  })
}

// jsdom does not implement IntersectionObserver, but several UI primitives
// (RevealSection, StatsBento, AppLoader's image lazy-load) depend on it.
// Provide a no-op shim that immediately reports "intersecting" so observers
// that gate reveal animations don't permanently hide content under test.
class FakeIntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []
  private cb: IntersectionObserverCallback

  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }

  observe(target: Element) {
    // Synchronously fire as visible so anything gated on visibility renders.
    this.cb(
      [
        {
          isIntersecting: true,
          intersectionRatio: 1,
          target,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  ;(window as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    FakeIntersectionObserver as unknown as typeof IntersectionObserver
}

// jsdom does not implement ResizeObserver either; Recharts and Radix tooltips
// hit it during layout measurement.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  ;(window as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
    FakeResizeObserver as unknown as typeof ResizeObserver
}

// matchMedia shim — some Radix and framer-motion code paths probe it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// Skip the AppLoader intro splash by pre-marking sessionStorage. Tests should
// land directly on the routed page instead of waiting ~2.3s for the loader.
beforeEach(() => {
  try {
    sessionStorage.setItem('fp.has_entered', '1')
  } catch {
    // sessionStorage is unavailable; not fatal — tests will just see splash.
  }
})

// Clear all storage and any pending timers/mocks between tests so per-test
// state (watchlists, search params, etc.) does not leak.
afterEach(() => {
  try {
    sessionStorage.clear()
    localStorage.clear()
  } catch {
    // Storage may be unavailable; nothing to clear.
  }
})
