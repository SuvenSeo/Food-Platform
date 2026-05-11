import { OfferCard } from '../components/ui/offer-card'
import { LoadingBlock } from '../components/ui/loading-block'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionHeader } from '../components/ui/section-header'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { formatCurrency } from '../lib/format'

export function IntelligencePage() {
  const intelligenceQuery = useIntelligenceSummary()

  if (intelligenceQuery.isLoading) {
    return <LoadingBlock />
  }

  const data = intelligenceQuery.data

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Intelligence"
        title="National food price signals"
        description="The data-heavy command surface for value rankings, trend snapshots, and source freshness."
      />

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
