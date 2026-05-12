import { motion } from 'framer-motion'
import { Info, Link2, RefreshCw } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'

const sections = [
  {
    icon: Info,
    title: 'Informational use',
    body: 'Prices, comparisons, and basket estimates are informational signals built from normalised public data. They are not guarantees of availability or final transaction prices.',
  },
  {
    icon: Link2,
    title: 'Attribution and source links',
    body: 'Source names and outbound links remain part of the product so users can inspect original retailer or market context alongside the normalised view.',
  },
  {
    icon: RefreshCw,
    title: 'Platform evolution',
    body: 'Features, coverage, and federation surfaces may change as the food platform matures and connects into broader life-platform workflows.',
  },
]

export function TermsPage() {
  return (
    <section className="space-y-12">
      <SectionHeader
        eyebrow="Terms"
        title="Terms"
        description="A simple public terms surface clarifies how these signals should be used while the platform continues to expand."
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
              <h3 className="text-base font-semibold text-[#f5f5f5]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#737373]">{body}</p>
            </motion.article>
          ))}
        </div>
      </RevealSection>

      <RevealSection delay={80}>
        <div className="fp-panel max-w-2xl space-y-4">
          <p className="eyebrow-accent">Limitations</p>
          <p className="text-sm leading-7 text-[#a3a3a3]">
            The platform is a research and discovery tool. Pricing data may be delayed or incomplete. Always verify prices and availability directly with the source retailer before making purchasing decisions.
          </p>
          <p className="text-sm leading-7 text-[#a3a3a3]">
            Data collected is limited to publicly available retail listings and government/public market quotations. The platform does not scrape or store private pricing information.
          </p>
          <p className="text-xs text-[#404040]">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </RevealSection>
    </section>
  )
}
