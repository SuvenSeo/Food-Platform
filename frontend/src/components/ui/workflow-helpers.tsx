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
    <div className="border border-dashed border-[color:var(--color-border-hover)] bg-[color:var(--color-bg-secondary)] p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)]">
          <PackageOpen className="h-5 w-5 text-[color:var(--color-text-muted)]" />
        </div>
        <div>
          <h3 className="font-display text-[18px] font-semibold leading-[1.2] text-[color:var(--color-text-primary)]"
            style={{ fontVariationSettings: "'opsz' 36, 'wght' 600" }}>{title}</h3>
          <p className="mt-1 font-display text-[14px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
            style={{ fontVariationSettings: "'opsz' 24" }}>{description}</p>
          {hint && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-faint)]">{hint}</p>
          )}
          {(actionLabel || secondaryActionLabel) && (
            <div className="mt-4 flex flex-wrap gap-3">
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
      </div>
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
    <div className="border-l-[3px] border-l-[color:var(--chili-500)] border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-5">
      <div className="flex items-baseline gap-3">
        <span className="text-kicker">§ Stop press</span>
        <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--chili-500)]" aria-hidden="true" />
      </div>
      <h3 className="mt-2 font-display text-[20px] font-semibold leading-[1.15] text-[color:var(--color-text-primary)]"
        style={{ fontVariationSettings: "'opsz' 48, 'wght' 600" }}>{title}</h3>
      <p className="mt-2 font-display text-[15px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
        style={{ fontVariationSettings: "'opsz' 36" }}>{message}</p>
      {helper && <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">{helper}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="fp-button-primary text-xs"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset the type
          </button>
        )}
        {links.map((link) => (
          <Link key={link.to} to={link.to} className="fp-button-secondary text-xs">
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
    <aside className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)] p-5">
      <p className="text-kicker">§ {title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="inline-flex items-center gap-1.5 border border-[color:var(--color-border-hover)] bg-[color:var(--color-bg-card)] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-text-primary)] hover:text-[color:var(--color-text-primary)]"
          >
            {link.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </aside>
  )
}
