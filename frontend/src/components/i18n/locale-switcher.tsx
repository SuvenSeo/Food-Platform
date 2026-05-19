import type { Locale } from '../../i18n/locale-provider'
import { useLocale } from '../../hooks/use-locale'

const OPTIONS: Locale[] = ['en', 'si', 'ta']

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <label className="sr-only">
      Language
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="rounded-full border border-border bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground"
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
