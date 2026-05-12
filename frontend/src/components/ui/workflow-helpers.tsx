import { ArrowRight, RefreshCcw, AlertTriangle, PackageOpen } from 'lucide-react'
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
    <div className="fp-empty flex flex-col items-start gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#161616]">
        <PackageOpen className="h-5 w-5 text-[#737373]" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-[#f5f5f5]">{title}</h3>
        <p className="mt-1.5 text-sm text-[#737373]">{description}</p>
        {hint && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#404040]">{hint}</p>
        )}
      </div>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap gap-2">
          {actionLabel && actionTo && (
            <Link to={actionTo} className="fp-button-secondary text-xs">
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
          {secondaryActionLabel && secondaryActionTo && (
            <Link to={secondaryActionTo} className="fp-button-secondary text-xs">
              {secondaryActionLabel}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export function ErrorState({
  title = 'Could not load this section',
  message,
  helper,
  onRetry,
  links = [],
}: ErrorStateProps) {
  return (
    <div className="rounded-card border p-5 flex flex-col gap-4"
      style={{ borderColor: 'rgba(248,113,113,0.2)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-red-300">{title}</h3>
      </div>
      <div className="text-sm text-red-400/80 space-y-1.5">
        <p>{message}</p>
        {helper && <p className="text-red-400/60">{helper}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-pill border border-red-500/25 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/15"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex items-center gap-1.5 rounded-pill border border-white/[0.10] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#a3a3a3] transition hover:text-[#f5f5f5]"
          >
            {link.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export function NextActionLinks({ title, links }: { title: string; links: WorkflowLink[] }) {
  return (
    <aside className="fp-soft-card">
      <p className="eyebrow-label">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex items-center gap-1.5 rounded-pill border border-white/[0.10] px-4 py-2 text-xs font-semibold text-[#a3a3a3] transition hover:text-[#f5f5f5] hover:border-white/[0.18]"
          >
            {link.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ))}
      </div>
    </aside>
  )
}
