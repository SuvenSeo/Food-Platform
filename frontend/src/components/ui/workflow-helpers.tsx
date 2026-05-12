import { ArrowRight, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

type EmptyStateProps = {
  title: string
  description: string
  hint?: string
  actionLabel?: string
  actionTo?: string
  secondaryActionLabel?: string
  secondaryActionTo?: string
}

type ErrorStateProps = {
  title?: string
  message: string
  helper?: string
  onRetry?: () => void
  links?: WorkflowLink[]
}

type WorkflowLink = {
  label: string
  to: string
}

export function EmptyState({
  title,
  description,
  hint,
  actionLabel,
  actionTo,
  secondaryActionLabel,
  secondaryActionTo,
}: EmptyStateProps) {
  return (
    <div className="fp-empty">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2">{description}</p>
      {hint ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{hint}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {actionLabel && actionTo ? (
          <Link to={actionTo} className="fp-button-secondary">
            {actionLabel}
          </Link>
        ) : null}
        {secondaryActionLabel && secondaryActionTo ? (
          <Link to={secondaryActionTo} className="fp-button-secondary">
            {secondaryActionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export function ErrorState({ title = 'Could not load this section', message, helper, onRetry, links = [] }: ErrorStateProps) {
  return (
    <div className="fp-empty border-red-200 bg-red-50 text-red-700">
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="mt-2">{message}</p>
      {helper ? <p className="mt-2 text-sm text-red-800">{helper}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="fp-button-secondary mt-4">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </button>
      ) : null}
      {links.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="fp-button-secondary">
              {link.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function NextActionLinks({ title, links }: { title: string; links: WorkflowLink[] }) {
  return (
    <aside className="fp-soft-card">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="fp-button-secondary">
            {link.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        ))}
      </div>
    </aside>
  )
}
