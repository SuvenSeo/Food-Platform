import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '../../lib/utils'

type EditorialHeroProps = {
  eyebrow: ReactNode
  title: ReactNode
  description: string
  primaryCta: { label: string; to: string }
  secondaryCta?: { label: string; to: string }
  footer?: ReactNode
  className?: string
}

export function EditorialHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  footer,
  className,
}: EditorialHeroProps) {
  return (
    <section
      className={cn(
        'relative -mx-4 grid gap-y-10 px-4 pb-12 pt-6 sm:-mx-6 sm:px-6 lg:grid-cols-[1.35fr_1px_0.65fr] lg:gap-x-10 lg:pb-20 lg:pt-8',
        className,
      )}
    >
      {/* LEFT — masthead title block */}
      <div className="relative flex flex-col">
        {/* kicker — sticker style */}
        <motion.div
          initial={{ opacity: 0, y: -6, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -1.4 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 inline-flex w-fit items-center gap-2 self-start border-2 border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-text-primary)] shadow-[3px_3px_0_var(--color-text-primary)]"
        >
          {eyebrow}
        </motion.div>

        {/* title — Fraunces masthead */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="text-masthead text-balance max-w-[14ch]"
        >
          {title}
        </motion.h1>

        {/* italic lede */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          className="text-lede mt-7 max-w-[58ch] text-pretty"
        >
          {description}
        </motion.p>

        {/* byline rule + CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.34 }}
          className="mt-10"
        >
          <div className="rule-dotted h-px w-full max-w-[420px]" aria-hidden="true" />
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to={primaryCta.to} className="fp-button-primary">
              {primaryCta.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {secondaryCta && (
              <Link
                to={secondaryCta.to}
                className="group inline-flex items-center gap-2 font-display text-[15px] italic text-[color:var(--color-text-primary)] underline decoration-[color:var(--color-text-primary)] decoration-1 underline-offset-[6px] transition-all hover:decoration-[color:var(--chili-500)] hover:text-[color:var(--chili-500)]"
              >
                {secondaryCta.label}
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            )}
          </div>
          {footer && (
            <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              {footer}
            </p>
          )}
        </motion.div>
      </div>

      {/* COLUMN RULE — visible on lg */}
      <div className="hidden self-stretch bg-[color:var(--color-border-hover)] lg:block" aria-hidden="true" />

      {/* RIGHT — editorial column: a "front-page brief" excerpt */}
      <motion.aside
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="relative flex flex-col gap-6 lg:pt-2"
        aria-label="Front page brief"
      >
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[color:var(--chili-500)]">
            § Editor’s brief
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
            P. 01
          </span>
        </div>

        <div className="rule-double h-1.5 w-full" aria-hidden="true" />

        <p className="font-display text-[17px] italic leading-[1.55] text-[color:var(--color-text-secondary)] [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:mt-1 [&::first-letter]:font-display [&::first-letter]:text-6xl [&::first-letter]:font-bold [&::first-letter]:not-italic [&::first-letter]:leading-[0.85] [&::first-letter]:text-[color:var(--chili-500)]">
          Daily, our scrapers walk Spar, Glomark, Keells and Cargills shelves and gather what the
          wet markets quote in Pettah, Kandy, Galle. We normalise the noise so you can read
          one number per item and one trend per week — the way the news desk would want it.
        </p>

        <div className="rule-dotted h-px w-full" aria-hidden="true" />

        <div className="grid grid-cols-3 gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
          <div>
            <p className="num text-[22px] font-bold text-[color:var(--color-text-primary)]">04</p>
            <p>Retail chains</p>
          </div>
          <div>
            <p className="num text-[22px] font-bold text-[color:var(--color-text-primary)]">25</p>
            <p>Districts</p>
          </div>
          <div>
            <p className="num text-[22px] font-bold text-[color:var(--color-text-primary)]">3×</p>
            <p>Languages</p>
          </div>
        </div>
      </motion.aside>
    </section>
  )
}
