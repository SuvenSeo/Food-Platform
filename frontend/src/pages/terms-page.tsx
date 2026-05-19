import { Info, Link2, RefreshCw } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'

const sections = [
  {
    icon: Info,
    title: 'Informational use',
    body: 'Prices, comparisons, basket estimates, and movement labels are informational signals built from normalised public data. They are not guarantees of availability or final transaction prices.',
  },
  {
    icon: Link2,
    title: 'Attribution and source links',
    body: 'Source names and outbound links remain part of the product so users can inspect the original retailer or market context alongside the normalised view.',
  },
  {
    icon: RefreshCw,
    title: 'Platform evolution',
    body: 'Features, coverage, endpoints, and federation surfaces may change as the food platform matures and connects into broader life-platform workflows.',
  },
]

export function TermsPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Legal column"
        title="Terms"
        description="A compact public terms column for pricing signals, attribution, and platform limitations."
      />

      <article className="grid gap-8 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-6 shadow-paper lg:grid-cols-[0.72fr_1.28fr] lg:p-8">
        <aside className="border-b border-[color:var(--color-text-primary)] pb-6 lg:border-b-0 lg:border-r lg:pr-8">
          <p className="text-kicker">Limitations</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-none text-[color:var(--color-text-primary)]">
            Verify final price and availability at the source.
          </h2>
          <p className="mt-5 text-sm leading-7 text-[color:var(--color-text-secondary)]">
            The platform is a research and discovery tool. Pricing data may be delayed, incomplete, or temporarily unavailable while source feeds update.
          </p>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
            Last updated: 19 May 2026
          </p>
        </aside>

        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, body }) => (
            <section key={title} className="grid gap-4 border-b border-dotted border-[color:var(--color-border-hover)] pb-6 last:border-b-0 last:pb-0 sm:grid-cols-[48px_1fr]">
              <div className="flex h-12 w-12 items-center justify-center border border-[color:var(--color-border-hover)] bg-[color:var(--color-bg-secondary)]">
                <Icon className="h-5 w-5 text-[color:var(--chili-500)]" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-text-secondary)]">{body}</p>
              </div>
            </section>
          ))}
        </div>
      </article>
    </section>
  )
}
