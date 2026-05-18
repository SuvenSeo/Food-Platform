import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Scale, ShoppingBasket, Store, Waves, TrendingDown,
} from 'lucide-react'

import { Panel } from '../components/primitives/panel'
import { Metric } from '../components/primitives/metric'
import { EditorialHero } from '../components/marketing/editorial-hero'
import { FeatureBento } from '../components/marketing/feature-bento'
import { LiveTicker } from '../components/marketing/live-ticker'
import { OfferCard } from '../components/ui/offer-card'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { useHomeSummary } from '../hooks/use-home-summary'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCompactDate, formatCurrency } from '../lib/format'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { ErrorState } from '../components/ui/workflow-helpers'

const workspaceFeatures = [
  {
    title: 'Retail discovery',
    description: 'Dense offer grid with source filters and fair-price bands.',
    href: '/retail',
    icon: Store,
  },
  {
    title: 'Market watch',
    description: 'District quotes from official and field sources.',
    href: '/markets',
    icon: Waves,
  },
  {
    title: 'Intelligence desk',
    description: 'Rankings, trends, and source health in one brief.',
    href: '/intelligence',
    icon: BarChart3,
    accent: true,
  },
  {
    title: 'Compare districts',
    description: 'Side-by-side wet-market deltas with watchlist saves.',
    href: '/compare',
    icon: Scale,
  },
  {
    title: 'Basket workspace',
    description: 'Household presets with availability-aware totals.',
    href: '/basket',
    icon: ShoppingBasket,
  },
]

export function HomePage() {
  const homeQuery = useHomeSummary()
  const intelligenceQuery = useIntelligenceSummary()
  const isLoading = homeQuery.isLoading || intelligenceQuery.isLoading
  const home = homeQuery.data
  const intelligence = intelligenceQuery.data
  const hasError = homeQuery.isError || intelligenceQuery.isError
  const movers = intelligence?.rankings.top_value ?? home?.spotlights.cheapest_offers ?? []

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

      <EditorialHero
        eyebrow={
          <div className="inline-flex items-center gap-2.5 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-2">
            <span className="eyebrow-accent">
              {home?.hero.platform ?? 'FoodLK · Sri Lanka price intelligence'}
            </span>
            <span className="live-dot-orange" aria-hidden="true" />
          </div>
        }
        title={
          home?.hero.headline ?? (
            <>
              Track how food prices
              <br />
              move across retail
              <br />
              shelves and markets.
            </>
          )
        }
        description="Follow Sri Lankan grocery and wet-market pricing with editorial clarity, high data density, and practical tools built for everyday decisions."
        primaryCta={{ label: 'Start discovery', to: '/retail' }}
        secondaryCta={{ label: 'Open intelligence desk', to: '/intelligence' }}
        footer={`Last refreshed ${formatCompactDate(home?.hero.last_updated_at ?? null)}`}
      />

      {!isLoading && movers.length > 0 && (
        <RevealSection>
          <LiveTicker offers={movers} />
        </RevealSection>
      )}

      <RevealSection>
        {isLoading ? (
          <SectionSkeleton cards={4} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Offers indexed"
              value={(home?.kpis.offers_count ?? 0).toLocaleString()}
              helper="Normalised retail offers ready for search and ranking."
              highlight
            />
            <Metric
              label="Sources tracked"
              value={home?.kpis.sources_count ?? 0}
              helper="Approved grocery feeds contributing live data."
            />
            <Metric
              label="Categories covered"
              value={home?.kpis.categories_count ?? 0}
              helper="Category pages on the same aggregate layer."
            />
            <Metric
              label="Market quotes"
              value={(home?.kpis.market_quotes_count ?? 0).toLocaleString()}
              helper="District snapshots for produce intelligence."
            />
          </div>
        )}
      </RevealSection>

      <RevealSection>
        <section className="space-y-6">
          <SectionHeader
            eyebrow="Discovery"
            title="What moved today"
            description="Current retail opportunities — branch into intelligence for validation."
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

      <RevealSection>
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel className="space-y-5">
            <SectionHeader
              eyebrow="Markets"
              title="Public market watch"
              description="Wet-market snapshots with source and timing context."
            />
            {isLoading ? (
              <SectionSkeleton cards={2} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(home?.spotlights.market_quotes ?? []).map((quote) => (
                  <article key={quote.id} className="fp-soft-card">
                    <p className="eyebrow-label">{quote.district}</p>
                    <h3 className="mt-2 text-base font-semibold text-foreground">{quote.market_name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{quote.item_name}</p>
                    <p className="num mt-3 text-xl font-semibold text-foreground">
                      Rs {formatCurrency(quote.price_lkr)}{' '}
                      <span className="text-sm font-normal text-muted-foreground">/ {quote.unit}</span>
                    </p>
                    <p className="mt-2 text-xs text-faint">{formatCompactDate(quote.quoted_at ?? null)}</p>
                  </article>
                ))}
              </div>
            )}
            <Link to="/markets" className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300">
              View all market quotes <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Panel>

          <Panel variant="accent" className="relative overflow-hidden">
            <SectionHeader
              eyebrow="Workspace"
              title="Decision tools"
              description="Move from discovery into compare, basket, and intelligence workflows."
            />
            <FeatureBento items={workspaceFeatures} className="mt-6" />
          </Panel>
        </section>
      </RevealSection>

      {!isLoading && (intelligence?.rankings.top_value ?? []).length > 0 && (
        <RevealSection delay={100}>
          <Panel className="space-y-5">
            <SectionHeader
              eyebrow="Lead signal"
              title="Top-value signals right now"
              description="Discovery snapshot with provenance before deeper analysis."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {(intelligence?.rankings.top_value ?? []).slice(0, 2).map((offer) => (
                <div key={offer.id} className="fp-soft-card">
                  <div className="flex items-start gap-4">
                    {offer.image_url && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
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
                      <p className="mt-1.5 truncate text-base font-semibold text-foreground">
                        {offer.display_name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="num text-lg font-semibold text-brand-400">
                          Rs {formatCurrency(offer.price_lkr)}
                        </p>
                        {offer.delta_vs_median_pct !== null && offer.delta_vs_median_pct < -5 && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
                            <TrendingDown className="h-3 w-3" aria-hidden="true" />
                            {offer.delta_vs_median_pct.toFixed(1)}%
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
          </Panel>
        </RevealSection>
      )}
    </div>
  )
}
