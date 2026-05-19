import { motion } from 'framer-motion'
import { Code2, Terminal } from 'lucide-react'

import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'

const endpointCards = [
  {
    title: 'Market intelligence',
    endpoint: '/api/v1/home/summary',
    method: 'GET',
    body: 'Homepage-ready editorial payload with hero, KPI, and spotlight cards.',
  },
  {
    title: 'Compare districts',
    endpoint: '/api/v1/compare/districts?left=Colombo&right=Kandy',
    method: 'GET',
    body: 'District produce comparison for the public compare workflow.',
  },
  {
    title: 'Basket presets',
    endpoint: '/api/v1/basket/estimate?preset=essentials',
    method: 'GET',
    body: 'Preset-ready household basket totals for embedded utilities and watchlists.',
  },
]

const useCases = [
  'Build public widgets for price pulse, basket cost, and district comparison.',
  'Feed future life-platform federation from stable JSON summaries instead of scraping UI pages.',
  'Support newsroom, civic-tech, or consumer-app integrations with a simple starting surface.',
]

export function DevelopersPage() {
  return (
    <section className="space-y-12">
      <SectionHeader
        eyebrow="Developers"
        title="Public data and integration surface"
        description="A lightweight public developer surface helps the food platform behave like a real intelligence product, not just a private dashboard."
      />

      <RevealSection>
        <div className="overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] shadow-paper">
          <div className="hidden grid-cols-[0.45fr_1fr_1.1fr] border-b border-[color:var(--color-text-primary)] bg-[color:var(--color-bg-secondary)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-text-muted)] md:grid">
            <span>Method</span>
            <span>Endpoint</span>
            <span>Use</span>
          </div>
          {endpointCards.map((card, i) => (
            <motion.article
              key={card.endpoint}
              className="grid gap-3 border-b border-dotted border-[color:var(--color-border-hover)] px-4 py-5 last:border-b-0 md:grid-cols-[0.45fr_1fr_1.1fr] md:items-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <p className="md:hidden eyebrow-label mb-2">{card.title}</p>
                <Badge variant="green">{card.method}</Badge>
              </div>
              <code className="break-all font-mono text-xs font-semibold leading-5 text-[color:var(--chili-600)]">
                {card.endpoint}
              </code>
              <p className="text-sm leading-7 text-[color:var(--color-text-secondary)]">{card.body}</p>
            </motion.article>
          ))}
        </div>
      </RevealSection>

      {/* Use cases */}
      <RevealSection delay={80}>
        <div
          className="fp-panel"
          style={{ borderColor: 'rgba(249,115,22,0.12)', background: 'linear-gradient(135deg, rgba(249,115,22,0.05) 0%, transparent 60%)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
              <Terminal className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Use cases</h3>
          </div>
          <ul className="space-y-3">
            {useCases.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-secondary-foreground">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </RevealSection>

      {/* Code snippet example */}
      <RevealSection delay={120}>
        <div className="fp-panel space-y-4">
          <div className="flex items-center gap-3">
            <Code2 className="h-4 w-4 text-orange-400" />
            <p className="eyebrow-label">Quick start</p>
          </div>
          <div className="overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]">
            <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-2">
              <p className="text-xs text-[color:var(--color-text-muted)]">fetch example</p>
              <Badge variant="neutral">JavaScript</Badge>
            </div>
            <pre className="overflow-x-auto p-4 text-xs leading-6 text-[color:var(--color-text-secondary)]">
              <code>{`const res = await fetch('/api/v1/home/summary')
const data = await res.json()

// data.hero.headline — hero copy
// data.kpis.offers_count — live offer count
// data.spotlights.cheapest_offers — top deals`}</code>
            </pre>
          </div>
        </div>
      </RevealSection>
    </section>
  )
}
