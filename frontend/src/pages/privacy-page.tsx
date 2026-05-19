import { motion } from 'framer-motion'
import { Lock, Globe, Activity } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'

const sections = [
  {
    icon: Lock,
    title: 'Browser-local watchlists',
    body: 'Watchlists currently live in local browser storage. They are not synced to a server or shared across devices.',
  },
  {
    icon: Globe,
    title: 'Public market and retail data',
    body: 'Product pages display aggregated public pricing signals and source links. The platform is designed around market transparency, not private household data collection.',
  },
  {
    icon: Activity,
    title: 'Operational telemetry',
    body: 'Deployment and platform tooling may record standard logs for reliability, build diagnostics, and abuse prevention.',
  },
]

export function PrivacyPage() {
  return (
    <section className="space-y-12">
      <SectionHeader
        eyebrow="Privacy"
        title="Privacy"
        description="This first public privacy surface explains what the food platform stores today and what remains local to the browser."
      />

      <RevealSection>
        <div className="grid gap-4 lg:grid-cols-3">
          {sections.map(({ icon: Icon, title, body }, i) => (
            <motion.article
              key={title}
              className="premium-card p-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                <Icon className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
            </motion.article>
          ))}
        </div>
      </RevealSection>

      <RevealSection delay={80}>
        <div className="fp-panel max-w-2xl">
          <p className="eyebrow-accent mb-4">Summary</p>
          <p className="text-sm leading-7 text-secondary-foreground">
            The Food Platform is a read-only intelligence layer over public Sri Lankan grocery and market data. No personal information is collected, processed, or stored on our servers beyond standard deployment logs.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </RevealSection>
    </section>
  )
}
