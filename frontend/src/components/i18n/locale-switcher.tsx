import type { Locale } from '../../i18n/locale-provider'
import { useLocale } from '../../hooks/use-locale'

const OPTIONS: Locale[] = ['en', 'si', 'ta']

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="h-8 rounded-none border border-white/15 bg-white/[0.04] px-2 font-mono text-[10px] font-semibold uppercase text-[color:var(--paper-200)] transition hover:border-[color:var(--turmeric)] hover:text-[color:var(--turmeric)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--turmeric)]"
        aria-label="Select language"
      >
        {OPTIONS.map((code) => (
          <option key={code} value={code}>
            {t(`locale.${code}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
