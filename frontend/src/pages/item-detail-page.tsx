import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ArrowLeft, ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'

import { AlertSignup } from '../components/retention/alert-signup'
import { FoodItemImage } from '../components/primitives/food-item-image'
import { OfferCard } from '../components/ui/offer-card'
import { LoadingBlock } from '../components/ui/loading-block'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

function forecastIcon(direction: string) {
  if (direction === 'down') return <TrendingDown className="h-4 w-4 text-[color:var(--curry-leaf)]" aria-hidden="true" />
  if (direction === 'up') return <TrendingUp className="h-4 w-4 text-[color:var(--chili-600)]" aria-hidden="true" />
  return <TrendingUp className="h-4 w-4 text-[color:var(--turmeric-deep)]" aria-hidden="true" />
}

export function ItemDetailPage() {
  const { slug } = useParams()
  const itemQuery = useQuery({
    queryKey: ['item-detail', slug],
    queryFn: () => api.getItem(slug || ''),
    enabled: Boolean(slug),
  })

  if (itemQuery.isLoading) return <LoadingBlock message="Loading item intelligence..." />
  if (itemQuery.isError) return <ErrorState message="Unable to load this item right now." onRetry={() => itemQuery.refetch()} />
  if (!itemQuery.data) {
    return <EmptyState title="Item not found" description="Return to the price workspace and choose another item." actionLabel="Open prices" actionTo="/prices" />
  }

  const data = itemQuery.data
  const chartData = data.district_history.map((point) => ({
    period: point.period,
    price: point.avg_price_lkr,
    min: point.min_price_lkr,
    max: point.max_price_lkr,
    dataPoints: point.data_points,
  }))
  const forecast = data.forecast

  return (
    <section className="space-y-8">
      <Link to="/prices" className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text-muted)] transition hover:text-[color:var(--color-text-primary)]">
        <ArrowLeft className="h-4 w-4" />
        Back to prices
      </Link>

      <div className="fp-panel grid gap-6 lg:grid-cols-[220px_1fr]">
        <FoodItemImage
          src={data.item.image_url}
          name={data.item.canonical_name}
          category={data.item.category}
          className="h-56 w-full"
          imgClassName="p-4"
          priority
        />
        <div className="min-w-0">
          <p className="eyebrow-accent">{data.item.category}</p>
          <h1
            className="mt-3 font-display text-[color:var(--color-text-primary)]"
            style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', letterSpacing: 0, fontVariationSettings: "'opsz' 120, 'wght' 650" }}
          >
            {data.item.canonical_name}
          </h1>
          <div className="mt-6 grid gap-[1px] overflow-hidden rounded-lg bg-[color:var(--color-border)] md:grid-cols-4">
            {[
              { label: 'Retail offers', value: data.item.retail_offers_count },
              { label: 'Market quotes', value: data.item.market_quotes_count },
              { label: 'Retail low', value: data.summary.lowest_retail_price_lkr ? `රු ${formatCurrency(data.summary.lowest_retail_price_lkr)}` : '—' },
              { label: 'Market low', value: data.summary.lowest_market_price_lkr ? `රු ${formatCurrency(data.summary.lowest_market_price_lkr)}` : '—' },
            ].map((item) => (
              <div key={item.label} className="bg-[color:var(--color-bg-card)] p-4">
                <p className="text-kicker">{item.label}</p>
                <p className="num mt-2 text-2xl font-bold text-[color:var(--color-text-primary)]">{item.value}</p>
              </div>
            ))}
            </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="fp-panel">
          <p className="text-kicker">§ Forecast</p>
          <div className="mt-4 flex items-center gap-2">
            {forecastIcon(forecast.direction)}
            <p className="font-display text-2xl font-semibold text-[color:var(--color-text-primary)]">
              {forecast.label}
            </p>
          </div>
          <p className="num mt-3 text-3xl font-bold text-[color:var(--color-text-primary)]">
            {forecast.next_estimate_lkr != null ? `රු ${formatCurrency(forecast.next_estimate_lkr)}` : '—'}
          </p>
          <p className="mt-3 text-sm leading-6 text-[color:var(--color-text-secondary)]">
            {forecast.basis} Confidence: {forecast.confidence}.
          </p>
        </div>

        <div className="fp-panel space-y-4">
          <p className="text-kicker">§ Price history</p>
          {chartData.length > 1 ? (
            <div className="h-72" role="img" aria-label={`Price history for ${data.item.canonical_name}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="itemHistory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c8321e" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#c8321e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="period" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={64} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 0, color: 'var(--color-text-primary)', fontSize: 12 }}
                    formatter={(value) => [`රු ${Number(value).toLocaleString()}`, 'Average']}
                  />
                  <Area type="monotone" dataKey="price" stroke="#c8321e" strokeWidth={2} fill="url(#itemHistory)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="History is still building"
              description="This item needs more dated market observations before a useful chart can be drawn."
            />
          )}
        </div>
      </div>

      <section className="space-y-5">
        <SectionHeader
          eyebrow="Sources"
          title="Retail source comparison"
          description="Use this before leaving home: compare current shelf prices, package size, freshness, and source links."
          level="h2"
        />
        {data.source_comparison.length ? (
          <div className="grid gap-[1px] bg-[color:var(--color-border)] md:grid-cols-2">
            {data.source_comparison.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
          </div>
        ) : (
          <EmptyState
            title="No retail source match yet"
            description="This item currently has market quote coverage but no matching retail offer."
            actionLabel="Open markets"
            actionTo="/markets"
          />
        )}
      </section>

      <AlertSignup
        defaultScope="category"
        defaultScopeValue={data.item.category}
        title={`Watch ${data.item.canonical_name}`}
        subtitle="Create a category alert from this item page. If confirmation email is not configured, FoodLK saves it in preview mode."
      />

      <section className="fp-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-kicker">§ Raw exports</p>
            <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
              Download the item history for external analysis.
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`/api/v1/items/${data.item.slug}/history.csv`} className="fp-button-secondary">CSV <ArrowUpRight className="h-3 w-3" /></a>
            <a href={`/api/v1/items/${data.item.slug}/history.json`} className="fp-button-secondary">JSON <ArrowUpRight className="h-3 w-3" /></a>
          </div>
        </div>
      </section>

      <NextActionLinks
        title="Continue"
        links={[
          { label: 'Browse price workspace', to: '/prices' },
          { label: 'Compare districts', to: '/compare' },
          { label: 'Build a basket', to: '/basket' },
        ]}
      />
    </section>
  )
}
