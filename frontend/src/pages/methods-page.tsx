import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'
import { formatCompactDate, formatCurrency } from '../lib/format'

export function MethodsPage() {
  const statsQuery = useQuery({
    queryKey: ['stats-summary'],
    queryFn: api.getStats,
  })
  const pipelineQuery = useQuery({
    queryKey: ['pipeline-status'],
    queryFn: api.getPipeline,
  })

  if (statsQuery.isLoading || pipelineQuery.isLoading) {
    return <LoadingBlock />
  }

  const stats = statsQuery.data
  const pipeline = pipelineQuery.data?.items ?? []

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Trust"
        title="Methods"
        description="A finished public intelligence product should explain collection, freshness, methodology, and limits with the same clarity it uses for rankings."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Normalization</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Retail offers are cleaned into comparable names, units, and price-per-unit fields before they appear in public views.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Fair-price logic</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The fair-price layer compares an offer against its normalized cluster median so bargains and premium listings are signposted clearly.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
          <h3 className="text-xl font-semibold text-slate-950">Coverage and limitations</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Retail feeds and wet-market quotes come from different collection paths, so freshness windows and compare coverage can vary by category and district.
          </p>
        </article>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <SectionHeader
          eyebrow="Source freshness"
          title="Source freshness"
          description="Live operational visibility should sit in the public product, not only in internal tools."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {pipeline.map((item) => (
            <article key={`${item.source}-${item.finished_at}`} className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{item.source}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.items_stored} stored from {item.items_seen} seen
                  </p>
                </div>
                <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  {item.status}
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-600">Updated {formatCompactDate(item.finished_at)}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <SectionHeader
            eyebrow="Coverage"
            title="Current public coverage"
            description="A compact disclosure of how much live data the platform currently presents."
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Offers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(stats?.offers_count)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sources</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(stats?.sources_count)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Categories</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(stats?.categories_count)}</p>
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Public citation</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Sri Lanka Food Intelligence aggregates retail listings and public market quotes into normalized product surfaces. Always verify final price and availability at the original source before purchasing.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_60px_rgba(201,111,29,0.12)]">
          <SectionHeader
            eyebrow="Public product"
            title="Public product surfaces"
            description="Trust, legal, and developer surfaces make the platform easier to reuse and easier to trust."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/developers" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Developers
            </Link>
            <Link to="/privacy" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              Privacy
            </Link>
            <Link to="/terms" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
              Terms
            </Link>
          </div>
          <ul className="mt-6 space-y-2 text-sm leading-7 text-slate-700">
            <li>Freshness and source status are visible directly inside the product.</li>
            <li>Legal and privacy pages clarify what is local-only and what is public data.</li>
            <li>Developer-facing routes prepare the platform for future federation and embeds.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
