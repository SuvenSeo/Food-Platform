import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight, BarChart3, Scale, ShoppingBasket, Store, Waves, TrendingDown } from 'lucide-react'

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
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intelligenceQuery = useIntelligenceSummary()
  const isLoading = homeQuery.isLoading || intelligenceQuery.isLoading
  const home = homeQuery.data
  const intelligence = intelligenceQuery.data
  const hasError = homeQuery.isError || intelligenceQuery.isError

  return (
    <div className="space-y-20">
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

      {/* ── Full-bleed Hero ── */}
      <section className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 pt-10 pb-20 overflow-hidden">
        {/* Ambient background layers */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.11) 0%, transparent 55%),
              radial-gradient(ellipse 60% 40% at 80% 80%, rgba(249,115,22,0.05) 0%, transparent 50%)
            `,
          }}
        />
        {/* Horizontal rule at bottom */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1200px]">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            {/* Live eyebrow pill */}
            <motion.div variants={fadeUp} className="mb-8 flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 rounded-full border px-4 py-2"
                style={{ borderColor: 'rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.08)' }}>
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-orange-400" aria-hidden="true">
                  <path d="M6 17a10 10 0 0 0 20 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <line x1="4" y1="17" x2="28" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                  <path d="M16 6 C13 9 11 11 12 15 C13 17.5 19 17.5 20 14 C21.5 10 19 7 16 6Z" fill="currentColor"/>
                </svg>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">
                  {home?.hero.platform ?? 'FoodLK · Sri Lanka price intelligence'}
                </span>
                <span className="live-dot-orange" aria-hidden="true" />
              </div>
            </motion.div>

            {/* Headline — display serif, very large */}
            <motion.h1
              variants={fadeUp}
              className="text-balance text-[#f5f5f5]"
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: 'clamp(3rem, 8vw, 6.5rem)',
                lineHeight: 1.0,
                letterSpacing: '-0.04em',
              }}
            >
              {home?.hero.headline ?? (
                <>
                  Track how food prices<br />
                  move across retail<br />
                  shelves and markets.
                </>
              )}
            </motion.h1>

            {/* Sub-copy */}
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-8 text-[#a3a3a3]"
              style={{ letterSpacing: '-0.01em' }}
            >
              Follow Sri Lankan grocery and wet-market pricing with richer comparisons,
              stronger signal design, and practical tools built for everyday decisions.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/retail" className="fp-button-primary text-sm h-11 px-6">
                Start discovery
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/intelligence" className="fp-button-secondary text-sm h-11 px-6">
                Open intelligence desk
              </Link>
            </motion.div>

            {/* Freshness */}
            <motion.p variants={fadeUp} className="mt-8 text-xs text-[#404040]">
              Last refreshed {formatCompactDate(home?.hero.last_updated_at ?? null)}
            </motion.p>
          </motion.div>
        </div>
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
                    <p className="mt-0.5 text-sm text-[#a3a3a3]">{quote.item_name}</p>
                    <p className="num mt-3 text-xl font-semibold text-[#f5f5f5]">
                      Rs {formatCurrency(quote.price_lkr)}{' '}
                      <span className="text-sm text-[#737373] font-normal">/ {quote.unit}</span>
                    </p>
                    <p className="mt-2 text-xs text-[#404040]">{formatCompactDate(quote.quoted_at ?? null)}</p>
                  </article>
                ))}
              </div>
            )}
            <Link to="/markets" className="inline-flex items-center gap-1.5 text-sm text-orange-400 transition-colors hover:text-orange-300">
              View all market quotes <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          {/* Decision workspace */}
          <div
            className="fp-panel relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.07) 0%, rgba(249,115,22,0.02) 100%)',
              borderColor: 'rgba(249,115,22,0.14)',
            }}
          >
            <div
              className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full blur-2xl"
              style={{ background: 'rgba(249,115,22,0.10)' }}
              aria-hidden="true"
            />
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
              <div className="mt-8 grid grid-cols-2 gap-2">
                {[
                  { to: '/retail', label: 'Retail', icon: Store },
                  { to: '/markets', label: 'Markets', icon: Waves },
                  { to: '/intelligence', label: 'Intelligence', icon: BarChart3 },
                  { to: '/compare', label: 'Compare', icon: Scale },
                  { to: '/basket', label: 'Basket', icon: ShoppingBasket },
                ].map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 rounded-md border px-3 py-2.5 text-xs font-semibold text-[#a3a3a3] transition hover:bg-white/[0.06] hover:text-[#f5f5f5]"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <Icon className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── Top-value signal panel ── */}
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
                  <div className="flex items-start gap-4">
                    {offer.image_url && (
                      <div
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#111111]"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <img
                          src={offer.image_url}
                          alt={offer.display_name}
                          className="h-full w-full object-contain p-1"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="eyebrow-label">{offer.source}</p>
                      <p className="mt-1.5 text-base font-semibold text-[#f5f5f5] truncate">{offer.display_name}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="num text-lg font-semibold text-orange-400">
                          Rs {formatCurrency(offer.price_lkr)}
                        </p>
                        {offer.delta_vs_median_pct !== null && offer.delta_vs_median_pct < -5 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
                            <TrendingDown className="h-3 w-3" aria-hidden="true" />
                            {offer.delta_vs_median_pct.toFixed(1)}%
                          </span>
                        )}
                        {offer.price_band && (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/25">
                            {offer.price_band}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/intelligence" className="fp-button-secondary w-fit">
              Full intelligence desk <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </RevealSection>
      )}
    </div>
  )
}
