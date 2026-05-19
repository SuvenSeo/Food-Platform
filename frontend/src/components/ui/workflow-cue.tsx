import { ArrowRight, HelpCircle, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useDismissedGuidance } from '../../hooks/use-dismissed-guidance'
import { cn } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

type WorkflowCueProps = {
  id: string
  eyebrow: string
  title: string
  body: string
  points?: string[]
  actionLabel?: string
  actionTo?: string
  secondaryActionLabel?: string
  secondaryActionTo?: string
  className?: string
}

export function WorkflowCue({
  id,
  eyebrow,
  title,
  body,
  points = [],
  actionLabel,
  actionTo,
  secondaryActionLabel,
  secondaryActionTo,
  className,
}: WorkflowCueProps) {
  const { dismissed, dismiss } = useDismissedGuidance(id)

  if (dismissed) return null

  return (
    <aside className={cn('workflow-cue', className)} aria-label={title}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-kicker">§ {eyebrow}</span>
          <HelpCircle className="h-3.5 w-3.5 text-[color:var(--chili-500)]" aria-hidden="true" />
        </div>
        <h2
          className="mt-2 font-display text-[22px] leading-[1.08] text-[color:var(--color-text-primary)]"
          style={{ fontVariationSettings: "'opsz' 48, 'wght' 620" }}
        >
          {title}
        </h2>
        <p
          className="mt-2 max-w-[70ch] font-display text-[15px] italic leading-[1.5] text-[color:var(--color-text-secondary)]"
          style={{ fontVariationSettings: "'opsz' 36" }}
        >
          {body}
        </p>
        {points.length > 0 && (
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {points.slice(0, 3).map((point, index) => (
              <li key={point} className="workflow-cue-step">
                <span className="num font-mono text-[10px] text-[color:var(--color-text-faint)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
        {actionLabel && actionTo && (
          <Link to={actionTo} className="fp-button-primary text-xs">
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
        {secondaryActionLabel && secondaryActionTo && (
          <Link to={secondaryActionTo} className="fp-button-secondary text-xs">
            {secondaryActionLabel}
          </Link>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={dismiss}
                className="workflow-cue-dismiss"
                aria-label={`Dismiss ${title} guidance`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Hide this note on this browser</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  )
}
