import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Mail, Search } from 'lucide-react'

import { confirmAlert } from '../lib/api'

export function AlertConfirmPage() {
  const [params] = useSearchParams()
  const token = params.get('token')?.trim() ?? ''
  const confirmMutation = useMutation({
    mutationFn: confirmAlert,
  })
  const { mutate, status } = confirmMutation

  useEffect(() => {
    if (token && status === 'idle') {
      mutate(token)
    }
  }, [mutate, status, token])

  if (!token) {
    return (
      <section className="mx-auto max-w-3xl border-y border-[color:var(--color-border-strong)] py-12">
        <p className="stamp">Alert desk</p>
        <div className="mt-6 flex items-start gap-4">
          <AlertTriangle className="mt-1 h-7 w-7 shrink-0 text-[color:var(--chili-500)]" aria-hidden="true" />
          <div>
            <h1 className="font-display text-[clamp(2.2rem,7vw,5rem)] leading-none text-[color:var(--color-text-primary)]">
              Confirmation link is incomplete
            </h1>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[color:var(--color-text-secondary)]">
              Open the newest email from FoodLK and use the full confirmation link, including the token.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const failed = confirmMutation.isError
  const confirmed = confirmMutation.isSuccess

  return (
    <section className="mx-auto max-w-3xl border-y border-[color:var(--color-border-strong)] py-12">
      <p className="stamp">Alert desk</p>
      <div className="mt-6 flex items-start gap-4">
        {confirmed ? (
          <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-[color:var(--curry-leaf)]" aria-hidden="true" />
        ) : failed ? (
          <AlertTriangle className="mt-1 h-7 w-7 shrink-0 text-[color:var(--chili-500)]" aria-hidden="true" />
        ) : (
          <Mail className="mt-1 h-7 w-7 shrink-0 text-[color:var(--turmeric-deep)]" aria-hidden="true" />
        )}
        <div>
          <h1 className="font-display text-[clamp(2.2rem,7vw,5rem)] leading-none text-[color:var(--color-text-primary)]">
            {confirmed ? 'Alert confirmed' : failed ? 'Alert could not be confirmed' : 'Confirming your alert'}
          </h1>
          <p className="mt-4 max-w-[58ch] text-base leading-7 text-[color:var(--color-text-secondary)]">
            {confirmed
              ? 'Your price alert is active. You can now use the catalog and saved views knowing this email is verified.'
              : failed
                ? 'This token may have expired or already been removed. Create a fresh alert from the price catalog.'
                : 'FoodLK is verifying the token from your email.'}
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link className="btn-primary" to="/items">
          <Search className="h-4 w-4" aria-hidden="true" />
          Price catalog
        </Link>
        <Link className="btn-secondary" to="/watchlists">
          Manage saved views
        </Link>
      </div>
    </section>
  )
}
