import { useState, type FormEvent } from 'react'
import { Bell } from 'lucide-react'

import { useLocale } from '../../hooks/use-locale'
import { subscribeAlert } from '../../lib/api'

const SCOPES = [
  { id: 'basket', label: 'Basket preset' },
  { id: 'category', label: 'Category' },
  { id: 'district', label: 'District' },
] as const

export function AlertSignup() {
  const { t } = useLocale()
  const [email, setEmail] = useState('')
  const [scope, setScope] = useState<(typeof SCOPES)[number]['id']>('basket')
  const [scopeValue, setScopeValue] = useState('essentials')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const result = await subscribeAlert({
        email,
        scope,
        scope_value: scopeValue || null,
        cadence: 'weekly',
      })
      setStatus('done')
      setMessage(result.message || t('alerts.success'))
    } catch {
      setStatus('error')
      setMessage('Could not save subscription. Try again shortly.')
    }
  }

  return (
    <section className="fp-panel rounded-shell border p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-500/25">
          <Bell className="h-5 w-5 text-orange-400" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{t('alerts.title')}</h2>
          <p className="mt-1 text-sm text-muted">{t('alerts.subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-muted">{t('alerts.email')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="fp-input w-full"
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">{t('alerts.scope')}</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="fp-input w-full"
          >
            {SCOPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted">Scope value</span>
          <input
            type="text"
            value={scopeValue}
            onChange={(e) => setScopeValue(e.target.value)}
            className="fp-input w-full"
            placeholder={scope === 'basket' ? 'essentials' : scope === 'category' ? 'grocery' : 'Colombo'}
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" className="fp-button-primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving…' : t('alerts.submit')}
          </button>
          {message && (
            <p className={`mt-3 text-sm ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`} role="status">
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
