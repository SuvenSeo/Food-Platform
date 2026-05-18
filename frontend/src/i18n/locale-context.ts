import { createContext } from 'react'

export type Locale = 'en' | 'si' | 'ta'

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)
