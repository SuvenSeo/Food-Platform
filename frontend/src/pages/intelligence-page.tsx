import { OfferCard } from '../components/ui/offer-card'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { SectionHeader } from '../components/ui/section-header'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { useIntelligenceBrief } from '../hooks/use-intelligence-brief'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCompactDate, formatCurrency } from '../lib/format'

export function IntelligencePage() {
  const intelligenceQuery = useIntelligenceSummary()
  const briefQuery = useIntelligenceBrief()
  const isLoading = intelligenceQuery.isLoading || briefQuery.isLoading

  const data = intelligenceQuery.data
  const brief = briefQuery.data
  const briefContent = brief?.brief
  const urgency = briefContent?.urgency ?? 'routine'
  const highlights = briefContent?.highlights ?? []
  const recommendations = briefContent?.recommendations ?? []
  const topValueOffers = data?.rankings?.top_value ?? []
  const trendSnapshot = data?.rankings?.trend_snapshot ?? []
  const sourceItems = data?.sources ?? []
  const hasDataGap = intelligenceQuery.isError || briefQuery.isError || !data || !briefContent
  const urgencyTone =
    urgency === 'action-needed'
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : urgency === 'watch'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200'

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Intelligence desk"
        title="National food price signals"
        description="Deeper intelligence context after discovery: value rankings, trend clusters, source freshness, and confidence."
      />
      {isLoading ? <SectionSkeleton cards={2} /> : null}
      {hasDataGap ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some intelligence modules are temporarily unavailable. Showing the latest data we could load.
        </p>
      ) : null}
      {intelligenceQuery.isError && briefQuery.isError ? (
        <ErrorState
          title="Intelligence modules are degraded"
          message="Both summary and brief feeds failed to load."
          helper="Try retrying now or continue from discovery pages while upstream data reconnects."
          onRetry={() => {
            void intelligenceQuery.refetch()
            void briefQuery.refetch()
          }}
          links={[
            { label: 'Open retail discovery', to: '/retail' },
            { label: 'Open markets', to: '/markets' },
          ]}
        />
      ) : null}

      <div className="rounded-[2rem] border border-orange-100 bg-orange-50/80 p-6 shadow-[0_20px_60px_rgba(201,111,29,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">Command brief</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{briefContent?.headline ?? 'Brief currently unavailable.'}</h3>
            <p className="mt-2 text-sm text-slate-600">Updated {formatCompactDate(brief?.generated_at ?? null)}</p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${urgencyTone}`}>
            {urgency.replace('-', ' ')}
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {highlights.length > 0 ? (
            highlights.map((item) => (
              <article key={item.label} className="rounded-2xl bg-white/90 p-4 ring-1 ring-orange-100">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{item.value}</p>
              </article>
            ))
          ) : (
            <article className="rounded-2xl bg-white/90 p-4 ring-1 ring-orange-100 lg:col-span-3">
              <p className="text-sm text-slate-600">Highlights unavailable right now.</p>
            </article>
          )}
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-orange-100 lg:grid-cols-3">
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Freshness</p>
            <p className="mt-2 text-sm text-slate-700">
              Last scrape {formatCompactDate(brief?.trust?.freshness?.last_scrape_at ?? null)}
            </p>
          </article>
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Provenance</p>
            <p className="mt-2 text-sm text-slate-700">
              {brief?.trust?.pipeline?.healthy_sources ?? 0} / {brief?.trust?.pipeline?.total_sources ?? 0} healthy sources
            </p>
          </article>
          <article>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Confidence</p>
            <p className="mt-2 text-sm text-slate-700">
              {brief?.trust?.confidence?.grade ?? 'unknown'} ({brief?.trust?.confidence?.score ?? 0}/100)
            </p>
          </article>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended actions</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {recommendations.length > 0 ? (
                recommendations.map((item) => <li key={item}>- {item}</li>)
              ) : (
                <li>- No recommendations available right now.</li>
              )}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live spotlight</p>
            <p className="mt-3 text-sm text-slate-700">
              {brief?.top_value_offer
                ? `${brief.top_value_offer.display_name} at Rs ${formatCurrency(brief.top_value_offer.price_lkr)}`
                : 'Top value offer unavailable right now.'}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {brief?.latest_market_signal
                ? `${brief.latest_market_signal.item_name} in ${brief.latest_market_signal.district} (${brief.latest_market_signal.market_name}) at Rs ${formatCurrency(brief.latest_market_signal.price_lkr)}`
                : 'No recent market signal available.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
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
            sourceItems.map((item) => <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />)
          ) : (
            <EmptyState
              title="Source pipeline updates are unavailable right now"
              description="No ingestion updates were returned for this session."
              hint="Next action: review discovery pages while source jobs recover."
              actionLabel="Open retail discovery"
              actionTo="/retail"
            />
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <SectionHeader eyebrow="Trends" title="Trend snapshot" description="A compact cluster view that will later expand into deeper category and district intelligence." />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {isLoading ? (
            <SectionSkeleton cards={2} />
          ) : trendSnapshot.length > 0 ? (
            trendSnapshot.map((item) => (
              <article key={item.cluster_key} className="rounded-[1.5rem] bg-slate-50 p-4">
                <h3 className="text-lg font-semibold text-slate-950">{item.brand ? `${item.brand} ` : ''}{item.canonical_name}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Median Rs {formatCurrency(item.median_price_lkr)} · {item.offers_count} offers
                </p>
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
      </div>
    </section>
  )
}