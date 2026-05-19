import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

import { OfferCard } from '../components/ui/offer-card'
import { PipelineCard } from '../components/ui/pipeline-card'
import { SectionSkeleton } from '../components/ui/section-skeleton'
import { EmptyState, ErrorState } from '../components/ui/workflow-helpers'
import { useIntelligenceBrief } from '../hooks/use-intelligence-brief'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { useMarketTrend } from '../hooks/use-market-trend'
import { useTrendsSummary } from '../hooks/use-trends-summary'
import { formatCompactDate, formatCurrency, mapTrendSeriesToChart } from '../lib/format'

const URGENCY_COLOR: Record<string, string> = {
  routine: 'var(--curry-leaf)',
  watch: 'var(--turmeric)',
  'action-needed': 'var(--chili-500)',
}

export function IntelligencePage() {
  const intelligenceQuery = useIntelligenceSummary()
  const briefQuery = useIntelligenceBrief()
  const trendsSummaryQuery = useTrendsSummary()
  const isLoading = intelligenceQuery.isLoading || briefQuery.isLoading || trendsSummaryQuery.isLoading

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

  return (
    <section className="space-y-12">
      {/* — Terminal masthead — */}
      <header className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <span className="text-kicker">§ Intelligence Desk</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
            Terminal mode · pre-market
          </span>
        </div>
        <h1
          className="font-display tracking-[-0.04em] text-[color:var(--color-text-primary)]"
          style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5.5rem)', lineHeight: '0.95', fontVariationSettings: "'opsz' 144, 'wght' 700" }}
        >
          National food <em className="font-display italic font-normal" style={{ color: URGENCY_COLOR[urgency] }}>signals.</em>
        </h1>
        <div className="rule-double h-1.5 w-full" aria-hidden="true" />
      </header>

      {intelligenceQuery.isError && briefQuery.isError && (
        <ErrorState
          title="Intelligence wires went dark"
          message="Both summary and brief feeds failed to load."
          helper="Try retry, or continue from discovery while upstream reconnects."
          onRetry={() => { void intelligenceQuery.refetch(); void briefQuery.refetch() }}
          links={[{ label: 'Open retail', to: '/retail' }, { label: 'Open markets', to: '/markets' }]}
        />
      )}

      {/* — Command brief panel — */}
      <article className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <span className="text-kicker">§ Command brief</span>
            <h2
              className="mt-3 max-w-[34ch] font-display leading-[1.05] tracking-[-0.025em] text-[color:var(--color-text-primary)]"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontVariationSettings: "'opsz' 96, 'wght' 600" }}
            >
              {briefContent?.headline ?? 'Brief currently unavailable.'}
            </h2>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              Updated {formatCompactDate(brief?.generated_at ?? null)}
            </p>
          </div>
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
            style={{ color: URGENCY_COLOR[urgency], borderBottom: `2px solid ${URGENCY_COLOR[urgency]}`, paddingBottom: 4 }}
          >
            // {urgency.replace('-', ' ')}
          </span>
        </div>

        {/* Highlights */}
        <div className="mt-7 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-3">
          {(highlights.length ? highlights : [{ label: '—', value: '—' }, { label: '—', value: '—' }, { label: '—', value: '—' }]).map((h, i) => (
            <div key={`${h.label}-${i}`} className="bg-[color:var(--color-bg-card)] p-5">
              <p className="text-kicker">{h.label}</p>
              <p
                className="mt-2 font-display text-[20px] leading-[1.1] tracking-[-0.025em] text-[color:var(--color-text-primary)]"
                style={{ fontVariationSettings: "'opsz' 48, 'wght' 600" }}
              >
                {h.value}
              </p>
            </div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-[1px] grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-3">
          {[
            { label: 'Freshness', value: formatCompactDate(brief?.trust?.freshness?.last_scrape_at ?? null) },
            { label: 'Provenance', value: `${brief?.trust?.pipeline?.healthy_sources ?? 0} / ${brief?.trust?.pipeline?.total_sources ?? 0} healthy` },
            { label: 'Confidence', value: `${brief?.trust?.confidence?.grade ?? '—'} · ${brief?.trust?.confidence?.score ?? 0}/100` },
          ].map((item) => (
            <div key={item.label} className="bg-[color:var(--color-bg-card)] p-4">
              <p className="text-kicker">{item.label}</p>
              <p className="num mt-1 font-mono text-[14px] text-[color:var(--color-text-primary)]">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Recs + spotlight */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div>
            <span className="text-kicker">§ Recommended</span>
            <ul className="mt-3 space-y-2.5">
              {(recommendations.length ? recommendations : ['Awaiting next ingest.']).map((rec) => (
                <li key={rec} className="flex items-baseline gap-3 border-b border-dotted border-[color:var(--color-border-hover)] pb-2 font-display text-[14px] leading-[1.45] text-[color:var(--color-text-secondary)]"
                  style={{ fontVariationSettings: "'opsz' 36" }}>
                  <span className="font-mono text-[10px] font-bold text-[color:var(--chili-500)]">▸</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l border-[color:var(--color-border)] pl-6">
            <span className="text-kicker">§ Live spotlight</span>
            {brief?.top_value_offer ? (
              <div className="mt-3">
                <p
                  className="font-display text-[18px] leading-[1.15] text-[color:var(--color-text-primary)]"
                  style={{ fontVariationSettings: "'opsz' 36, 'wght' 600" }}
                >
                  {brief.top_value_offer.display_name}
                </p>
                <p className="num mt-1 text-[28px] font-bold leading-none text-[color:var(--chili-500)]">
                  <span className="text-[12px] font-semibold text-[color:var(--color-text-muted)]">රු </span>
                  {formatCurrency(brief.top_value_offer.price_lkr)}
                </p>
              </div>
            ) : (
              <p className="mt-3 font-display text-[14px] italic text-[color:var(--color-text-muted)]">Spotlight unavailable.</p>
            )}
            {brief?.latest_market_signal && (
              <div className="mt-4 border-t border-[color:var(--color-border-hover)] pt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">Latest market signal</p>
                <p className="mt-1 font-display text-[14px] text-[color:var(--color-text-secondary)]"
                  style={{ fontVariationSettings: "'opsz' 24" }}>
                  {brief.latest_market_signal.item_name} <em>in</em> {brief.latest_market_signal.district}
                </p>
                <p className="num text-[16px] font-bold text-[color:var(--color-text-primary)]">
                  රු {formatCurrency(brief.latest_market_signal.price_lkr)}
                </p>
              </div>
            )}
          </div>
        </div>
      </article>

      {isLoading && <SectionSkeleton cards={2} />}

      {/* — Top value offers + sources — */}
      <section className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-kicker">§ Top-value offers</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">By delta vs median</span>
          </div>
          <div className="rule-double h-1.5 w-full" aria-hidden="true" />
          {topValueOffers.length ? (
            <div className="grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
              {topValueOffers.map((o) => <OfferCard key={o.id} offer={o} />)}
            </div>
          ) : (
            <EmptyState
              title="Top-value offers unavailable"
              description="Discovery cards are temporarily empty for this module."
              hint="Continue from retail while this feed repopulates."
              actionLabel="Open retail"
              actionTo="/retail"
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-kicker">§ Source pipeline</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">Last sweep</span>
          </div>
          <div className="rule-double h-1.5 w-full" aria-hidden="true" />
          {sourceItems.length ? (
            <div className="space-y-3">
              {sourceItems.map((item) => (
                <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Source pipeline silent"
              description="No ingestion updates returned for this session."
              actionLabel="Open retail"
              actionTo="/retail"
            />
          )}
        </div>
      </section>

      {/* — Trend chart — */}
      <article className="border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-kicker">§ Market trend</span>
          {topMarketItem && (
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
              {topMarketItem}
            </span>
          )}
        </div>
        <div className="rule-double mt-2 h-1.5 w-full" aria-hidden="true" />

        {trendsSummaryQuery.isLoading || marketTrendQuery.isLoading ? (
          <SectionSkeleton cards={1} />
        ) : marketTrendChartData.length > 1 ? (
          <div className="mt-6 h-72 w-full" role="img" aria-label={`Price trend for ${topMarketItem}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marketTrendChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="intelGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B3D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF6B3D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(248,240,220,0.07)" />
                <XAxis dataKey="period" tick={{ fill: '#8B8576', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: '#5A554A' }} tickLine={false} />
                <YAxis tick={{ fill: '#8B8576', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#181614', border: '1px solid #5A554A', borderRadius: 0, color: '#F4EDE0', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                  labelStyle={{ color: '#C6BFA5' }}
                  formatter={(v) => [`රු ${Number(v).toLocaleString()}`, 'Avg price']}
                />
                <Area type="monotone" dataKey="price" stroke="#FF6B3D" strokeWidth={2} fill="url(#intelGrad)" dot={false} activeDot={{ r: 4, fill: '#FF6B3D' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="No trend series yet"
            description="History is empty for the top-covered commodity."
            actionLabel="Open markets"
            actionTo="/markets"
          />
        )}

        {/* Cluster snapshot */}
        {trendSnapshot.length > 0 && (
          <div className="mt-8">
            <span className="text-kicker">§ Cluster snapshot</span>
            <div className="mt-3 grid gap-[1px] bg-[color:var(--color-border)] sm:grid-cols-2">
              {trendSnapshot.map((item) => (
                <article key={item.cluster_key} className="bg-[color:var(--color-bg-card)] p-4">
                  <p
                    className="font-display text-[16px] leading-[1.2] text-[color:var(--color-text-primary)]"
                    style={{ fontVariationSettings: "'opsz' 36, 'wght' 600" }}
                  >
                    {item.brand ? `${item.brand} ` : ''}{item.canonical_name}
                  </p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="num text-[20px] font-bold text-[color:var(--color-text-primary)]">
                      <span className="text-[10px] font-semibold text-[color:var(--color-text-muted)]">රු </span>
                      {formatCurrency(item.median_price_lkr)}
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-text-muted)]">
                      <span className="num text-[color:var(--color-text-primary)]">{item.offers_count}</span> offers
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </article>
    </section>
  )
}
