import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { notFoundRecoveryLinks } from '../config/navigation'

export function NotFoundPage() {
  return (
    <section className="grid min-h-[62vh] place-items-center">
      <div className="w-full max-w-4xl border-y border-[color:var(--color-border-strong)] py-10">
        <p className="stamp">Missing page · FoodLK desk</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
          <h1
            className="font-display text-[clamp(5rem,18vw,11rem)] font-bold leading-none text-[color:var(--color-text-primary)]"
            style={{ fontVariationSettings: "'opsz' 144, 'wght' 700" }}
          >
            404
          </h1>
          <div>
            <h2
              className="font-display text-[clamp(2rem,6vw,4.6rem)] leading-[0.98] text-[color:var(--color-text-primary)]"
              style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 30, 'wght' 620" }}
            >
              This stall has moved.
            </h2>
            <p className="mt-4 max-w-[58ch] text-base leading-7 text-[color:var(--color-text-secondary)]">
              The page you opened is not in today’s edition. Jump back into a scheduled price workflow.
            </p>
          </div>
        </div>

        <nav className="mt-10 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2 lg:grid-cols-4" aria-label="404 recovery">
          {notFoundRecoveryLinks.map(({ label, to, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-h-28 flex-col justify-between bg-[color:var(--color-bg-card)] p-4 transition-colors hover:bg-[color:var(--color-bg-card-hover)]"
            >
              <Icon className="h-5 w-5 text-[color:var(--chili-500)]" aria-hidden="true" />
              <span className="flex items-center justify-between gap-2 font-display text-lg text-[color:var(--color-text-primary)]">
                {label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}
