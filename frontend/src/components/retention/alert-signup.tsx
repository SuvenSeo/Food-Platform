import { useState, type FormEvent } from 'react'
import { Bell } from 'lucide-react'

import { subscribeAlert } from '../../lib/api'

const SCOPES = [
  { id: 'basket', label: 'Basket preset' },
  { id: 'category', label: 'Category' },
  { id: 'district', label: 'District' },
] as const

type AlertSignupProps = {
  title?: string
  subtitle?: string
  defaultScope?: (typeof SCOPES)[number]['id']
  defaultScopeValue?: string
  compact?: boolean
}

export function AlertSignup({
  title,
  subtitle,
  defaultScope = 'basket',
  defaultScopeValue = 'essentials',
  compact = false,
}: AlertSignupProps) {
  const [email, setEmail] = useState('')
  const [scope, setScope] = useState<(typeof SCOPES)[number]['id']>(defaultScope)
  const [scopeValue, setScopeValue] = useState(defaultScopeValue)
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
      setMessage(result.message || 'Alert saved. Email delivery may run in preview mode until confirmation mail is configured.')
    } catch {
      setStatus('error')
      setMessage('Could not save subscription. Try again shortly.')
    }
  }

  return (
    <section className={`fp-panel border ${compact ? 'p-4 sm:p-5' : 'p-6 sm:p-8'}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center border border-[color:var(--color-border-hover)] bg-[color:var(--color-accent-dim)] text-[color:var(--chili-600)]">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
            {title ?? 'Price alerts'}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[color:var(--color-text-secondary)]">
            {subtitle ?? 'Save a watched basket, category, or district. Email delivery may run in preview mode until confirmation mail is configured.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="eyebrow-label">Email</span>
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
          <span className="eyebrow-label">Alert scope</span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="fp-select w-full"
          >
            {SCOPES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="eyebrow-label">Scope value</span>
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
            {status === 'loading' ? 'Saving…' : 'Save alert'}
          </button>
          {message && (
            <p
              className={`mt-3 text-sm ${status === 'error' ? 'text-[color:var(--chili-600)]' : 'text-[color:var(--curry-leaf)]'}`}
              role="status"
            >
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
