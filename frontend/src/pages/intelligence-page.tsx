import { OfferCard } from '../components/ui/offer-card'
import { LoadingBlock } from '../components/ui/loading-block'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionHeader } from '../components/ui/section-header'
import { useIntelligenceBrief } from '../hooks/use-intelligence-brief'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCompactDate, formatCurrency } from '../lib/format'

export function IntelligencePage() {
  const intelligenceQuery = useIntelligenceSummary()
  const briefQuery = useIntelligenceBrief()

  if (intelligenceQuery.isLoading || briefQuery.isLoading) {
    return <LoadingBlock />
  }

  const data = intelligenceQuery.data
  const brief = briefQuery.data
  const urgencyTone =
    brief?.brief.urgency === 'action-needed'
      ? 'bg-rose-50 text-rose-700 ring-rose-200'
      : brief?.brief.urgency === 'watch'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200'

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Intelligence"
        title="National food price signals"
        description="The data-heavy command surface for value rankings, trend snapshots, and source freshness."
      />

      <div className="rounded-[2rem] border border-orange-100 bg-orange-50/80 p-6 shadow-[0_20px_60px_rgba(201,111,29,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-700">Command brief</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{brief?.brief.headline}</h3>
            <p className="mt-2 text-sm text-slate-600">Updated {formatCompactDate(brief?.generated_at ?? null)}</p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${urgencyTone}`}>
            {brief?.brief.urgency.replace('-', ' ')}
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {brief?.brief.highlights.map((item) => (
            <article key={item.label} className="rounded-2xl bg-white/90 p-4 ring-1 ring-orange-100">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-base font-semibold text-slate-950">{item.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl bg-white/90 p-4 ring-1 ring-orange-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended actions</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {brief?.brief.recommendations.map((item) => (
                <li key={item}>- {item}</li>
              ))}
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
          {data?.rankings.top_value.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
        <div className="space-y-4">
          {data?.sources.map((item) => <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />)}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <SectionHeader eyebrow="Trends" title="Trend snapshot" description="A compact cluster view that will later expand into deeper category and district intelligence." />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {data?.rankings.trend_snapshot.map((item) => (
            <article key={item.cluster_key} className="rounded-[1.5rem] bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-950">{item.brand ? `${item.brand} ` : ''}{item.canonical_name}</h3>
              <p className="mt-2 text-sm text-slate-600">
                Median Rs {formatCurrency(item.median_price_lkr)} · {item.offers_count} offers
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
