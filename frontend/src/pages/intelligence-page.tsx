import { motion, type Variants } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { OfferCard } from '../components/ui/offer-card'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { Badge } from '../components/ui/badge'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { useIntelligenceBrief } from '../hooks/use-intelligence-brief'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { useMarketTrend } from '../hooks/use-market-trend'
import { useTrendsSummary } from '../hooks/use-trends-summary'
import { formatCompactDate, formatCurrency, mapTrendSeriesToChart } from '../lib/format'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' },
  }),
}

export function IntelligencePage() {
  const intelligenceQuery = useIntelligenceSummary()
  const briefQuery = useIntelligenceBrief()
  const trendsSummaryQuery = useTrendsSummary()
  const isLoading =
    intelligenceQuery.isLoading || briefQuery.isLoading || trendsSummaryQuery.isLoading

  const data = intelligenceQuery.data
  const brief = briefQuery.data
  const briefContent = brief?.brief
  const urgency = briefContent?.urgency ?? 'routine'
  const highlights = briefContent?.highlights ?? []
  const recommendations = briefContent?.recommendations ?? []
  const topValueOffers = data?.rankings?.top_value ?? []
  const trendSnapshot = data?.rankings?.trend_snapshot ?? []
  const sourceItems = data?.sources ?? []
  const trendsSummary = trendsSummaryQuery.data
  const topMarketItem = trendsSummary?.top_items?.[0]?.item_name
  const marketTrendQuery = useMarketTrend(topMarketItem, { enabled: Boolean(topMarketItem) })
  const marketTrendChartData = mapTrendSeriesToChart(marketTrendQuery.data?.series ?? [])
  const hasDataGap =
    intelligenceQuery.isError ||
    briefQuery.isError ||
    trendsSummaryQuery.isError ||
    !data ||
    !briefContent

  const urgencyVariant =
    urgency === 'action-needed' ? 'red' : urgency === 'watch' ? 'amber' : 'green'
  const urgencyLabel = urgency.replace('-', ' ')

  return (
    <section className="space-y-10">
      <SectionHeader
        eyebrow="Intelligence desk"
        title="National food price signals"
        description="Deeper intelligence context after discovery: value rankings, trend clusters, source freshness, and confidence."
      />

      {hasDataGap && (
        <div className="rounded-md border px-4 py-3 text-sm text-amber-400"
          style={{ borderColor: 'rgba(251,191,36,0.2)', backgroundColor: 'rgba(251,191,36,0.06)' }}>
          Some intelligence modules are temporarily unavailable. Showing the latest data we could load.
        </div>
      )}

      {intelligenceQuery.isError && briefQuery.isError && (
        <ErrorState
          title="Intelligence modules are degraded"
          message="Both summary and brief feeds failed to load."
          helper="Try retrying now or continue from discovery pages while upstream data reconnects."
          onRetry={() => { void intelligenceQuery.refetch(); void briefQuery.refetch() }}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open markets', to: '/markets' },
          ]}
        />
      )}

      {isLoading ? <SectionSkeleton cards={3} /> : null}

      {/* ── Command Brief ── */}
      <RevealSection>
        <div
          className="relative overflow-hidden rounded-shell border p-7"
          style={{
            borderColor: 'rgba(249,115,22,0.18)',
            background: 'linear-gradient(135deg, rgba(249,115,22,0.06) 0%, rgba(249,115,22,0.02) 100%)',
          }}
        >
          {/* Glow */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl"
            style={{ background: 'rgba(249,115,22,0.10)' }} />

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <p className="eyebrow-accent">Command brief</p>
                <h3 className="mt-2 text-balance text-[#f5f5f5]"
                  style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', letterSpacing: '-0.025em' }}>
                  {briefContent?.headline ?? 'Brief currently unavailable.'}
                </h3>
                <p className="mt-2 text-xs text-[#737373]">
                  Updated {formatCompactDate(brief?.generated_at ?? null)}
                </p>
              </div>
              <Badge variant={urgencyVariant}>{urgencyLabel}</Badge>
            </div>

            {/* Highlights hairline bento */}
            <div className="hairline-grid rounded-lg overflow-hidden grid-cols-1 sm:grid-cols-3 mb-5">
              {highlights.length > 0 ? (
                highlights.map((item, i) => (
                  <motion.article
                    key={item.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="bg-[#0d0d0d] p-4"
                  >
                    <p className="eyebrow-label">{item.label}</p>
                    <p className="mt-2 text-base font-semibold text-[#f5f5f5]">{item.value}</p>
                  </motion.article>
                ))
              ) : (
                <article className="bg-[#0d0d0d] p-4 col-span-3">
                  <p className="text-sm text-[#737373]">Highlights unavailable right now.</p>
                </article>
              )}
            </div>

            {/* Trust meta */}
            <div className="hairline-grid rounded-lg overflow-hidden grid-cols-1 sm:grid-cols-3 mb-5">
              {[
                { label: 'Freshness', value: formatCompactDate(brief?.trust?.freshness?.last_scrape_at ?? null) },
                {
                  label: 'Provenance',
                  value: `${brief?.trust?.pipeline?.healthy_sources ?? 0} / ${brief?.trust?.pipeline?.total_sources ?? 0} healthy`,
                },
                {
                  label: 'Confidence',
                  value: `${brief?.trust?.confidence?.grade ?? 'unknown'} (${brief?.trust?.confidence?.score ?? 0}/100)`,
                },
              ].map((item) => (
                <article key={item.label} className="bg-[#0d0d0d] p-4">
                  <p className="eyebrow-label">{item.label}</p>
                  <p className="mt-2 text-sm text-[#a3a3a3]">{item.value}</p>
                </article>
              ))}
            </div>

            {/* Recs + live spotlight */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="fp-soft-card">
                <p className="eyebrow-label mb-3">Recommended actions</p>
                <ul className="space-y-2 text-sm text-[#a3a3a3]">
                  {recommendations.length > 0 ? (
                    recommendations.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-[#737373]">No recommendations available right now.</li>
                  )}
                </ul>
              </div>
              <div className="fp-soft-card">
                <p className="eyebrow-label mb-3">Live spotlight</p>
                {brief?.top_value_offer ? (
                  <div>
                    <p className="text-sm font-semibold text-[#f5f5f5]">{brief.top_value_offer.display_name}</p>
                    <p className="num mt-1 text-xl font-semibold text-orange-400">
                      Rs {formatCurrency(brief.top_value_offer.price_lkr)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#737373]">Top value offer unavailable.</p>
                )}
                {brief?.latest_market_signal && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    <p className="text-xs text-[#737373]">Latest market signal</p>
                    <p className="mt-1 text-sm text-[#a3a3a3]">
                      {brief.latest_market_signal.item_name} in {brief.latest_market_signal.district}
                    </p>
                    <p className="num text-base font-semibold text-[#f5f5f5]">
                      Rs {formatCurrency(brief.latest_market_signal.price_lkr)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── Trend chart + offers ── */}
      <RevealSection delay={80}>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            {isLoading ? (
              <SectionSkeleton cards={2} />
            ) : topValueOffers.length > 0 ? (
              topValueOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
            ) : (
              <EmptyState
                title="Top-value offers are unavailable right now"
                description="Discovery cards are temporarily empty for this module."
                hint="Next action: continue from retail while this feed repopulates."
                actionLabel="Open retail discovery"
                actionTo="/retail"
                secondaryActionLabel="Open markets"
                secondaryActionTo="/markets"
              />
            )}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <SectionSkeleton cards={2} />
            ) : sourceItems.length > 0 ? (
              sourceItems.map((item) => (
                <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />
              ))
            ) : (
              <EmptyState
                title="Source pipeline updates unavailable"
                description="No ingestion updates returned for this session."
                hint="Next action: review discovery pages while source jobs recover."
                actionLabel="Open retail"
                actionTo="/retail"
              />
            )}
          </div>
        </div>
      </RevealSection>

      {/* ── Market trend chart + retail snapshot ── */}
      <RevealSection delay={160}>
        <motion.div className="fp-panel space-y-6">
          <SectionHeader
            eyebrow="Trends"
            title="Official market price trend"
            description={
              topMarketItem
                ? `Monthly average from market quotes for ${topMarketItem}.`
                : 'Historical market quote coverage across indexed commodities.'
            }
          />

          {trendsSummaryQuery.isLoading || marketTrendQuery.isLoading ? (
            <SectionSkeleton cards={1} />
          ) : marketTrendChartData.length > 1 ? (
            <motion.div
              className="h-64 w-full"
              role="img"
              aria-label={
                topMarketItem
                  ? `Price trend chart for ${topMarketItem}`
                  : 'Market price trend chart'
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketTrendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="period" tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#f5f5f5', fontSize: 12 }}
                    labelStyle={{ color: '#a3a3a3' }}
                    formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Avg price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              {trendsSummary && (
                <p className="mt-3 text-xs text-[#737373]">
                  {trendsSummary.total_market_data_points.toLocaleString()} indexed market quotes
                  {topMarketItem ? ` · showing ${topMarketItem}` : ''}
                </p>
              )}
            </motion.div>
          ) : (
            <EmptyState
              title="No market trend series yet"
              description="Market history is empty for the top-covered commodity. Retail cluster snapshots below may still be available."
              hint="Try markets discovery or check back after the next official quote sync."
              actionLabel="Open markets"
              actionTo="/markets"
            />
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {isLoading ? (
              <SectionSkeleton cards={2} />
            ) : trendSnapshot.length > 0 ? (
              trendSnapshot.map((item) => (
                <article key={item.cluster_key} className="fp-soft-card">
                  <h3 className="text-base font-semibold text-[#f5f5f5]">
                    {item.brand ? `${item.brand} ` : ''}{item.canonical_name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="num text-lg text-[#f5f5f5]">
                      Rs {formatCurrency(item.median_price_lkr)}
                    </p>
                    <Badge variant="neutral">{item.offers_count} offers</Badge>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                title="Trend snapshot data is unavailable right now"
                description="This trend cluster is temporarily empty."
                hint="Next action: inspect district compare for directional shifts."
                actionLabel="Open compare"
                actionTo="/compare"
              />
            )}
          </div>
        </motion.div>
      </RevealSection>
    </section>
  )
}
