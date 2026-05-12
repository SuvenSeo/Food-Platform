import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, BarChart3, Scale, ShoppingBasket, Store, Waves, Soup } from 'lucide-react'

import { OfferCard } from '../components/ui/offer-card'
import { SectionHeader } from '../components/ui/section-header'
import { StatsBento } from '../components/ui/stats-bento'
import { RevealSection } from '../components/ui/reveal-section'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCompactDate, formatCurrency } from '../lib/format'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { ErrorState } from '../components/ui/workflow-helpers'

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intelligenceQuery = useIntelligenceSummary()
  const isLoading = homeQuery.isLoading || intelligenceQuery.isLoading
  const home = homeQuery.data
  const intelligence = intelligenceQuery.data
  const hasError = homeQuery.isError || intelligenceQuery.isError

  return (
    <div className="space-y-16">
      {hasError && (
        <ErrorState
          title="Home signal coverage is partial"
          message="Some discovery or intelligence sections could not be refreshed."
          helper="You can still continue into retail discovery and compare workflows while background data reconnects."
          onRetry={() => { void homeQuery.refetch(); void intelligenceQuery.refetch() }}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open intelligence desk', to: '/intelligence' },
          ]}
        />
      )}

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-shell border py-16 px-8 sm:px-12"
        style={{
          borderColor: 'rgba(255,255,255,0.07)',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 100%)',
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 right-0 h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-pill bg-orange-500/10 px-3 py-1.5 ring-1 ring-orange-500/20 mb-6">
            <Soup className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
              {home?.hero.platform ?? 'Sri Lanka food intelligence'}
            </span>
            <span className="live-dot-orange ml-1" />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-balance text-[#f5f5f5]"
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
            }}
          >
            {home?.hero.headline ?? 'Discovery and intelligence, one workflow'}
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-base leading-7 text-[#a3a3a3]">
            Follow Sri Lankan grocery and wet-market pricing with richer comparisons, stronger
            signal design, and practical tools built for everyday decisions.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link to="/retail" className="fp-button-primary">
              Start discovery
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/intelligence" className="fp-button-secondary">
              Open intelligence desk
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 text-xs text-[#404040]">
            Last refreshed {formatCompactDate(home?.hero.last_updated_at ?? null)}
          </motion.p>
        </motion.div>
      </section>

      {/* ── KPI bento ── */}
      <RevealSection>
        {isLoading ? (
          <SectionSkeleton cards={4} />
        ) : (
          <StatsBento
            columns={4}
            stats={[
              {
                label: 'Offers indexed',
                value: home?.kpis.offers_count ?? 0,
                helper: 'Normalised retail offers ready for search and ranking.',
                highlight: true,
              },
              {
                label: 'Sources tracked',
                value: home?.kpis.sources_count ?? 0,
                helper: 'Approved grocery feeds currently contributing live data.',
              },
              {
                label: 'Categories covered',
                value: home?.kpis.categories_count ?? 0,
                helper: 'Category pages built on the same aggregate layer.',
              },
              {
                label: 'Market quotes',
                value: home?.kpis.market_quotes_count ?? 0,
                helper: 'District market snapshots available for produce intelligence.',
              },
            ]}
          />
        )}
      </RevealSection>

      {/* ── Discovery spotlight ── */}
      <RevealSection>
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Discovery"
            title="What moved today"
            description="Start with discovery cards for current retail opportunities, then branch into intelligence pages for deeper validation."
          />
          {isLoading ? (
            <SectionSkeleton cards={3} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {(home?.spotlights.cheapest_offers ?? []).map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </section>
      </RevealSection>

      {/* ── Market watch + Decision workspace ── */}
      <RevealSection>
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Market watch */}
          <div className="fp-panel space-y-5">
            <SectionHeader
              eyebrow="Markets"
              title="Public market watch"
              description="Wet-market snapshots with source and timing context for quick trust checks."
            />
            {isLoading ? (
              <SectionSkeleton cards={2} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(home?.spotlights.market_quotes ?? []).map((quote) => (
                  <article key={quote.id} className="fp-soft-card">
                    <p className="eyebrow-label">{quote.district}</p>
                    <h3 className="mt-2 text-base font-semibold text-[#f5f5f5]">{quote.market_name}</h3>
                    <p className="mt-1 text-sm text-[#a3a3a3]">
                      {quote.item_name}
                    </p>
                    <p className="num mt-3 text-xl font-semibold text-[#f5f5f5]">
                      Rs {formatCurrency(quote.price_lkr)}{' '}
                      <span className="text-sm text-[#737373] font-normal">/ {quote.unit}</span>
                    </p>
                    <p className="mt-2 text-xs text-[#404040]">
                      {formatCompactDate(quote.quoted_at ?? null)}
                    </p>
                  </article>
                ))}
              </div>
            )}
            <Link to="/markets" className="inline-flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors">
              View all market quotes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Decision workspace */}
          <div
            className="fp-panel relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(249,115,22,0.03) 100%)', borderColor: 'rgba(249,115,22,0.15)' }}
          >
            <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full blur-2xl"
              style={{ background: 'rgba(249,115,22,0.10)' }} />
            <div className="relative">
              <SectionHeader
                eyebrow="Intelligence"
                title="Decision workspace"
                description="Move from discovery into intelligence workflows when you need confidence, trend context, and basket execution."
              />
              <div className="mt-6 space-y-3 text-sm leading-7 text-[#a3a3a3]">
                <p>Track basket cost across presets and save repeat views into local watchlists.</p>
                <p>Escalate to trend and compare surfaces when decisions need deeper confidence.</p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  { to: '/retail', label: 'Retail', icon: Store },
                  { to: '/markets', label: 'Markets', icon: Waves },
                  { to: '/intelligence', label: 'Intelligence', icon: BarChart3 },
                  { to: '/compare', label: 'Compare', icon: Scale },
                  { to: '/basket', label: 'Basket', icon: ShoppingBasket },
                ].map(({ to, label, icon: Icon }) => (
                  <Link key={to} to={to}
                    className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-[#a3a3a3] transition hover:bg-white/[0.08] hover:text-[#f5f5f5]">
                    <Icon className="h-3.5 w-3.5 text-orange-400" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── Lead signal panel ── */}
      {!isLoading && (intelligence?.rankings.top_value ?? []).length > 0 && (
        <RevealSection delay={100}>
          <section className="fp-panel space-y-5">
            <SectionHeader
              eyebrow="Lead signal"
              title="Top-value signals right now"
              description="Discovery snapshot with provenance hints before you open deeper analysis."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {(intelligence?.rankings.top_value ?? []).slice(0, 2).map((offer) => (
                <div key={offer.id} className="fp-soft-card">
                  <p className="eyebrow-label">{offer.source}</p>
                  <p className="mt-2 text-base font-semibold text-[#f5f5f5]">{offer.display_name}</p>
                  <p className="num mt-2 text-xl font-semibold text-orange-400">
                    Rs {formatCurrency(offer.price_lkr)}
                    {offer.price_band && <span className="ml-2 text-sm text-[#737373]">· {offer.price_band}</span>}
                  </p>
                </div>
              ))}
            </div>
            <Link to="/intelligence" className="fp-button-secondary w-fit">
              Full intelligence desk <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </RevealSection>
      )}
    </div>
  )
}
