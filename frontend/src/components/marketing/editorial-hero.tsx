import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'

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

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
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
        'relative -mx-4 overflow-hidden px-4 pb-20 pt-10 sm:-mx-6 sm:px-6',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.12) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 70%, rgba(249,115,22,0.05) 0%, transparent 50%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden="true"
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative max-w-4xl"
      >
        <motion.div variants={fadeUp} className="mb-8">
          {eyebrow}
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-display text-balance text-foreground">
          {title}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground"
        >
          {description}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
          <Link to={primaryCta.to} className="fp-button-primary h-11 px-6 text-sm">
            {primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {secondaryCta && (
            <Link to={secondaryCta.to} className="fp-button-secondary h-11 px-6 text-sm">
              {secondaryCta.label}
            </Link>
          )}
        </motion.div>

        {footer && (
          <motion.p variants={fadeUp} className="mt-8 text-xs text-faint">
            {footer}
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}
