import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useMarketTrend } from '../../hooks/use-market-trend'
import { useTrendsSummary } from '../../hooks/use-trends-summary'
import { formatCurrency, mapTrendSeriesToChart } from '../../lib/format'
import type { TrendSummaryItem } from '../../types'
import { FoodItemImage } from '../primitives/food-item-image'
import { EmptyState } from '../ui/workflow-helpers'
import { SectionSkeleton } from '../ui/section-skeleton'

type ChartPoint = {
  period: string
  price: number
  min: number | null
  max: number | null
  dataPoints: number
}

type MarketPulseChartViewProps = {
  activeItem?: string
  topItems: TrendSummaryItem[]
  chartData: ChartPoint[]
  loading?: boolean
  totalDataPoints?: number
}

function priceMovement(chartData: ChartPoint[]) {
  if (chartData.length < 2) return null
  const first = chartData[0].price
  const last = chartData[chartData.length - 1].price
  const delta = last - first
  const percent = first ? (delta / first) * 100 : 0
  return { delta, percent }
}

export function MarketPulseChartView({
  activeItem,
  topItems,
  chartData,
  loading = false,
  totalDataPoints = 0,
}: MarketPulseChartViewProps) {
  const movement = priceMovement(chartData)
  const hasChart = chartData.length > 1
  const activeItemRecord = topItems.find((item) => item.item_name === activeItem) ?? topItems[0]

  return (
    <section className="fp-chart-panel market-pulse" aria-label="Market pulse">
      <div className="market-pulse-head">
        <div>
          <span className="text-kicker">§ Market pulse</span>
          <h2
            className="mt-3 font-display text-[clamp(1.8rem,3.5vw,3rem)] leading-[0.98] text-[color:var(--color-text-primary)]"
            style={{ fontVariationSettings: "'opsz' 96, 'SOFT' 30, 'wght' 640" }}
          >
            The clearest price signal right now.
          </h2>
        </div>
        <div className="market-pulse-stamp">
          <span className="text-kicker">Series</span>
          <p className="num mt-1 text-2xl font-bold text-[color:var(--color-text-primary)]">
            {totalDataPoints.toLocaleString()}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
            quote points
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6">
          <SectionSkeleton cards={1} />
        </div>
      ) : hasChart ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                {activeItem && (
                  <FoodItemImage
                    src={activeItemRecord?.image_url}
                    name={activeItem}
                    className="h-16 w-16"
                  />
                )}
                <div className="min-w-0">
                <p className="font-display text-xl font-semibold text-[color:var(--color-text-primary)]">
                  {activeItem}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-text-muted)]">
                  Monthly public-market average
                </p>
                </div>
              </div>
              {movement && (
                <p className="num text-right font-mono text-[13px] font-bold uppercase tracking-[0.14em] text-[color:var(--color-text-primary)]">
                  {movement.delta >= 0 ? '+' : '-'}රු {formatCurrency(Math.abs(movement.delta))}
                  <span className="block text-[color:var(--color-text-muted)]">
                    {movement.percent >= 0 ? '+' : '-'}{Math.abs(movement.percent).toFixed(1)}%
                  </span>
                </p>
              )}
            </div>
            <div className="mt-4 h-64 w-full" role="img" aria-label={`Price trend for ${activeItem}`}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="marketPulseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2C4A22" stopOpacity={0.28} />
                      <stop offset="90%" stopColor="#2C4A22" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(14,14,12,0.10)" />
                  <XAxis dataKey="period" tick={{ fill: '#6B6657', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B6657', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={58} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFBF1', border: '1px solid #0E0E0C', borderRadius: 0, color: '#0E0E0C', fontSize: 12, fontFamily: 'JetBrains Mono' }}
                    formatter={(value) => [`රු ${Number(value).toLocaleString()}`, 'Avg price']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#2C4A22" strokeWidth={2.5} fill="url(#marketPulseGrad)" dot={false} activeDot={{ r: 4, fill: '#2C4A22' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <aside className="market-pulse-rank" aria-label="Best-covered commodities">
            <span className="text-kicker">§ Coverage leaders</span>
            <ol className="mt-4 space-y-3">
              {topItems.slice(0, 5).map((item, index) => (
                <li key={item.item_name} className="market-pulse-row">
                  <span className="num font-mono text-[10px] text-[color:var(--color-text-faint)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <FoodItemImage src={item.image_url} name={item.item_name} className="h-10 w-10" />
                  <span className="min-w-0 flex-1 truncate font-display text-[15px] text-[color:var(--color-text-primary)]">
                    {item.item_name}
                  </span>
                  <span className="num font-mono text-[11px] font-bold text-[color:var(--color-text-muted)]">
                    {item.data_points}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Market pulse is still forming"
            description="The chart appears once a commodity has enough dated quote observations."
            hint="Today’s spot prices remain available in the market quotes page."
            actionLabel="Open markets"
            actionTo="/markets"
          />
        </div>
      )}
    </section>
  )
}

export function MarketPulseChart() {
  const trendsSummaryQuery = useTrendsSummary()
  const topItems = trendsSummaryQuery.data?.top_items ?? []
  const activeItem = topItems[0]?.item_name
  const marketTrendQuery = useMarketTrend(activeItem, { enabled: Boolean(activeItem) })
  const chartData = mapTrendSeriesToChart(marketTrendQuery.data?.series ?? [])

  return (
    <MarketPulseChartView
      activeItem={activeItem}
      topItems={topItems}
      chartData={chartData}
      loading={trendsSummaryQuery.isLoading || marketTrendQuery.isLoading}
      totalDataPoints={trendsSummaryQuery.data?.total_market_data_points ?? marketTrendQuery.data?.total_data_points ?? 0}
    />
  )
}
