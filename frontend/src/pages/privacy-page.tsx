import { Activity, Globe, Lock } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'

const sections = [
  {
    icon: Lock,
    title: 'Browser-local watchlists',
    body: 'Saved baskets, comparison receipts, and clipped offers currently live in local browser storage. They are not synced to a server, shared across devices, or used to profile households.',
  },
  {
    icon: Globe,
    title: 'Public market and retail data',
    body: 'Product pages display aggregated public pricing signals and source links. The platform is designed around market transparency, not private household data collection.',
  },
  {
    icon: Activity,
    title: 'Operational telemetry',
    body: 'Deployment and platform tooling may record standard logs for reliability, build diagnostics, security review, and abuse prevention.',
  },
]

export function PrivacyPage() {
  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Legal column"
        title="Privacy"
        description="A plain-language privacy column for the public food intelligence product."
      />

      <article className="grid gap-8 border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-6 shadow-paper lg:grid-cols-[0.72fr_1.28fr] lg:p-8">
        <aside className="border-b border-[color:var(--color-text-primary)] pb-6 lg:border-b-0 lg:border-r lg:pr-8">
          <p className="text-kicker">At a glance</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-none text-[color:var(--color-text-primary)]">
            Local clips, public prices, ordinary platform logs.
          </h2>
          <p className="mt-5 text-sm leading-7 text-[color:var(--color-text-secondary)]">
            The Food Platform is a read-only intelligence layer over Sri Lankan grocery and market data. No personal information is collected, processed, or stored on our servers beyond standard deployment logs.
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
