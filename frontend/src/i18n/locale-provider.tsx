import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { LocaleContext, type Locale } from './locale-context'
import en from './locales/en.json'
import si from './locales/si.json'
import ta from './locales/ta.json'

const STORAGE_KEY = 'fp.locale'

const bundles: Record<Locale, Record<string, string>> = { en, si, ta }

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'si' || stored === 'ta' || stored === 'en') return stored
  return 'en'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = useCallback(
    (key: string) => bundles[locale][key] ?? bundles.en[key] ?? key,
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export type { Locale } from './locale-context'
