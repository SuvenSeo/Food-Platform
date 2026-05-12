import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck, TrendingUp, BarChart3 } from 'lucide-react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

const methodCards = [
  {
    icon: ShieldCheck,
    title: 'Normalisation',
    body: 'Retail offers are cleaned into comparable names, units, and price-per-unit fields before they appear in public views.',
  },
  {
    icon: TrendingUp,
    title: 'Fair-price logic',
    body: 'The fair-price layer compares an offer against its normalised cluster median so bargains and premium listings are signposted clearly.',
  },
  {
    icon: BarChart3,
    title: 'Coverage and limitations',
    body: 'Retail feeds and wet-market quotes come from different collection paths, so freshness windows and compare coverage can vary by category and district.',
  },
]

export function MethodsPage() {
  const statsQuery = useQuery({ queryKey: ['stats-summary'], queryFn: api.getStats })
  const pipelineQuery = useQuery({ queryKey: ['pipeline-status'], queryFn: api.getPipeline })

  if (statsQuery.isLoading || pipelineQuery.isLoading) {
    return <LoadingBlock />
  }

  const stats = statsQuery.data
  const pipeline = pipelineQuery.data?.items ?? []

  return (
    <section className="space-y-12">
      <SectionHeader
        eyebrow="Trust"
        title="Methods"
        description="A finished public intelligence product should explain collection, freshness, methodology, and limits with the same clarity it uses for rankings."
      />

      {/* Method cards */}
      <RevealSection>
        <div className="grid gap-4 lg:grid-cols-3">
          {methodCards.map(({ icon: Icon, title, body }, i) => (
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

      {/* Source freshness */}
      <RevealSection delay={80}>
        <div className="fp-panel space-y-6">
          <SectionHeader
            eyebrow="Source freshness"
            title="Source freshness"
            description="Live operational visibility sits in the public product, not only in internal tools."
          />
          <div className="grid gap-3 lg:grid-cols-2">
            {pipeline.map((item) => (
              <article key={`${item.source}-${item.finished_at}`} className="fp-soft-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#f5f5f5]">{item.source}</h3>
                    <p className="mt-1 text-xs text-[#737373]">
                      {item.items_stored.toLocaleString()} stored from {item.items_seen.toLocaleString()} seen
                    </p>
                  </div>
                  <Badge variant={item.status.toLowerCase() === 'success' ? 'green' : 'amber'}>
                    {item.status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[#404040]">Updated {formatCompactDate(item.finished_at)}</p>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* Coverage + public links */}
      <RevealSection delay={120}>
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="fp-panel space-y-5">
            <SectionHeader
              eyebrow="Coverage"
              title="Current public coverage"
              description="A compact disclosure of how much live data the platform currently presents."
            />
            <div className="hairline-grid rounded-lg overflow-hidden grid-cols-3">
              {[
                { label: 'Offers', value: formatCurrency(stats?.offers_count) },
                { label: 'Sources', value: formatCurrency(stats?.sources_count) },
                { label: 'Categories', value: formatCurrency(stats?.categories_count) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0d0d0d] p-4">
                  <p className="eyebrow-label">{label}</p>
                  <p className="num mt-2 text-xl font-semibold text-[#f5f5f5]">{value}</p>
                </div>
              ))}
            </div>
            <div
              className="rounded-card border p-5"
              style={{ borderColor: 'rgba(249,115,22,0.15)', background: 'rgba(249,115,22,0.05)' }}
            >
              <p className="eyebrow-accent mb-3">Public citation</p>
              <p className="text-sm leading-7 text-[#a3a3a3]">
                Sri Lanka Food Intelligence aggregates retail listings and public market quotes into normalised product surfaces. Always verify final price and availability at the original source before purchasing.
              </p>
            </div>
          </div>

          <div
            className="fp-panel"
            style={{ borderColor: 'rgba(249,115,22,0.12)', background: 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, transparent 60%)' }}
          >
            <SectionHeader
              eyebrow="Public product"
              title="Public product surfaces"
              description="Trust, legal, and developer surfaces make the platform easier to reuse and easier to trust."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/developers" className="fp-button-primary">Developers</Link>
              <Link to="/privacy" className="fp-button-secondary">Privacy</Link>
              <Link to="/terms" className="fp-button-secondary">Terms</Link>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                'Freshness and source status are visible directly inside the product.',
                'Legal and privacy pages clarify what is local-only and what is public data.',
                'Developer-facing routes prepare the platform for future federation and embeds.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#737373]">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RevealSection>
    </section>
  )
}
