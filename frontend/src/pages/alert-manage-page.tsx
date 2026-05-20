import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCircle2, Search, XCircle } from 'lucide-react'

import { manageAlert, unsubscribeAlert } from '../lib/api'

export function AlertManagePage() {
  const { token = '' } = useParams()
  const manageQuery = useQuery({
    queryKey: ['alert-manage', token],
    queryFn: () => manageAlert(token),
    enabled: Boolean(token),
  })
  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribeAlert,
    onSuccess: () => manageQuery.refetch(),
  })

  if (!token) {
    return (
      <section className="mx-auto max-w-3xl border-y border-[color:var(--color-border-strong)] py-12">
        <p className="stamp">Alert desk</p>
        <h1 className="mt-6 font-display text-[clamp(2.2rem,7vw,5rem)] leading-none text-[color:var(--color-text-primary)]">
          Manage link is incomplete
        </h1>
        <p className="mt-4 max-w-[58ch] text-base leading-7 text-[color:var(--color-text-secondary)]">
          Open the full manage link from your FoodLK email.
        </p>
      </section>
    )
  }

  const subscription = manageQuery.data?.subscription
  const isInactive = subscription?.active === false || unsubscribeMutation.isSuccess

  return (
    <section className="mx-auto max-w-4xl border-y border-[color:var(--color-border-strong)] py-12">
      <p className="stamp">Alert desk</p>
      <div className="mt-6 flex items-start gap-4">
        {manageQuery.isError ? (
          <AlertTriangle className="mt-1 h-7 w-7 shrink-0 text-[color:var(--chili-500)]" aria-hidden="true" />
        ) : isInactive ? (
          <XCircle className="mt-1 h-7 w-7 shrink-0 text-[color:var(--chili-500)]" aria-hidden="true" />
        ) : subscription?.confirmed ? (
          <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[color:var(--curry-leaf)]" aria-hidden="true" />
        ) : (
          <Bell className="mt-1 h-7 w-7 shrink-0 text-[color:var(--turmeric-deep)]" aria-hidden="true" />
        )}
        <div>
          <h1 className="font-display text-[clamp(2.2rem,7vw,5rem)] leading-none text-[color:var(--color-text-primary)]">
            Manage price alert
          </h1>
          <p className="mt-4 max-w-[58ch] text-base leading-7 text-[color:var(--color-text-secondary)]">
            Review the subscription linked to this secure token and turn it off whenever it stops being useful.
          </p>
        </div>
      </div>

      {manageQuery.isLoading && (
        <p className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
          Loading alert...
        </p>
      )}

      {manageQuery.isError && (
        <div className="mt-10 border border-[color:var(--chili-500)] bg-[color:var(--paper-50)] p-5">
          <p className="font-display text-xl text-[color:var(--color-text-primary)]">This alert could not be found.</p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-text-secondary)]">
            The token may have expired or the subscription may already be removed.
          </p>
        </div>
      )}

      {subscription && (
        <div className="mt-10 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
          {[
            ['Email', subscription.email],
            ['Scope', [subscription.scope, subscription.scope_value].filter(Boolean).join(' / ')],
            ['Cadence', subscription.cadence],
            ['Status', isInactive ? 'inactive' : subscription.confirmed ? 'confirmed' : 'pending confirmation'],
          ].map(([label, value]) => (
            <div key={label} className="bg-[color:var(--color-bg-card)] p-5">
              <p className="stamp">{label}</p>
              <p className="mt-3 font-display text-2xl text-[color:var(--color-text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link className="btn-primary" to="/prices">
          <Search className="h-4 w-4" aria-hidden="true" />
          Price catalog
        </Link>
        {subscription && !isInactive && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => unsubscribeMutation.mutate(token)}
            disabled={unsubscribeMutation.isPending}
          >
            {unsubscribeMutation.isPending ? 'Turning off...' : 'Turn off alert'}
          </button>
        )}
      </div>
    </section>
  )
}
