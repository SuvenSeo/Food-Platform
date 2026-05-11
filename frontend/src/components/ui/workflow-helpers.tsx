import { ArrowRight, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  actionTo?: string
}

type ErrorStateProps = {
  message: string
  onRetry?: () => void
}

type WorkflowLink = {
  label: string
  to: string
}

export function EmptyState({ title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="fp-empty">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2">{description}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="fp-button-secondary mt-4">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="fp-empty border-red-200 bg-red-50 text-red-700">
      <h3 className="text-base font-semibold text-red-900">Could not load this section</h3>
      <p className="mt-2">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="fp-button-secondary mt-4">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </button>
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
