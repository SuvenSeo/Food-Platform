import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, ArrowUpRight, Bookmark, TrendingDown, TrendingUp } from 'lucide-react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { RevealSection } from '../components/ui/reveal-section'
import { OfferCard } from '../components/ui/offer-card'
import { EmptyState, ErrorState, NextActionLinks } from '../components/ui/workflow-helpers'
import { useMarketTrend } from '../hooks/use-market-trend'
import { useWatchlists } from '../hooks/use-watchlists'
import { ApiError, api } from '../lib/api'
import { formatCompactDate, formatCurrency, mapTrendSeriesToChart } from '../lib/format'

export function OfferDetailPage() {
  const { offerId } = useParams()
  const { saveEntry } = useWatchlists()

  const offerQuery = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => api.getOffer(offerId || ''),
    enabled: Boolean(offerId),
  })
  const relatedQuery = useQuery({
    queryKey: ['related-offers', offerQuery.data?.category],
    queryFn: () => api.getOffers(`?category=${encodeURIComponent(offerQuery.data?.category || '')}`),
    enabled: Boolean(offerQuery.data?.category),
  })

  const trendItemName = offerQuery.data?.canonical_name || offerQuery.data?.display_name
  const marketTrendQuery = useMarketTrend(trendItemName, {
    enabled: Boolean(trendItemName),
  })
  const marketTrendChartData = mapTrendSeriesToChart(marketTrendQuery.data?.series ?? [])

  if (offerQuery.isLoading) return <LoadingBlock message="Loading offer detail..." />

  if (offerQuery.isError) {
    const isNotFound = offerQuery.error instanceof ApiError && offerQuery.error.status === 404
    if (isNotFound) {
      return (
        <div className="fp-panel">
          <EmptyState
            title="Offer not found"
            description="This offer may have expired. Return to prices and continue from an indexed listing."
            actionLabel="Back to prices"
            actionTo="/prices"
          />
        </div>
      )
    }
    return <ErrorState message="Unable to load this offer right now." onRetry={() => offerQuery.refetch()} />
  }

  if (!offerQuery.data) {
    return (
      <div className="fp-panel">
        <EmptyState title="Offer not found" description="Return to prices and choose another offer." actionLabel="Back to prices" actionTo="/prices" />
      </div>
    )
  }

  const offer = offerQuery.data
  const relatedOffers = (relatedQuery.data?.items ?? []).filter((item) => item.id !== offer.id).slice(0, 3)
  const delta = offer.delta_vs_median_pct
  const isCheap = delta !== null && delta > 5
  const isExpensive = delta !== null && delta < -5
  const deltaCopy =
    delta === null
      ? 'Pending median signal'
      : isCheap
      ? `${delta.toFixed(1)}% cheaper than median`
      : isExpensive
      ? `${Math.abs(delta).toFixed(1)}% above median`
      : `${delta.toFixed(1)}% near median`

  return (
    <section className="space-y-8">
      {/* Nav bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/prices"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to prices
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => saveEntry({
              id: `offer-${offer.id}`,
              title: offer.display_name,
              kind: 'offer',
              href: `/offers/${offer.id}`,
              summary: `Rs ${formatCurrency(offer.price_lkr)} · ${offer.price_band || 'pending signal'}`,
            })}
            className="inline-flex items-center gap-2 rounded-pill bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/15"
          >
            <Bookmark className="h-4 w-4" />
            Save offer
          </button>
          {offer.url && (
            <a
              href={offer.url}
              target="_blank"
              rel="noreferrer"
              className="fp-button-secondary"
            >
              Visit source <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Hero */}
      <motion.div
        className="fp-panel relative overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl"
          style={{ background: 'rgba(249,115,22,0.10)' }} />
        <div className="relative">
          <p className="eyebrow-accent">Single-stall profile · {offer.source}</p>
          <h1
            className="mt-3 text-balance text-foreground"
            style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', letterSpacing: 0 }}
          >
            {offer.display_name}
          </h1>
          <p className="mt-2 text-muted-foreground">{offer.brand || 'Generic'} · {offer.category}</p>

          {/* KPI strip */}
          <div className="mt-6 hairline-grid rounded-lg overflow-hidden grid-cols-2 lg:grid-cols-4">
            <div className="bg-surface-soft p-4">
              <p className="eyebrow-label">Current price</p>
              <p className="num mt-2 text-2xl font-semibold text-orange-400">
                Rs {formatCurrency(offer.price_lkr)}
              </p>
              {delta !== null && (
                <p className={`num mt-1 flex items-center gap-1 text-xs font-semibold ${isCheap ? 'text-emerald-400' : isExpensive ? 'text-red-400' : 'text-muted-foreground'}`}>
                  {isCheap ? <TrendingDown className="h-3 w-3" /> : isExpensive ? <TrendingUp className="h-3 w-3" /> : null}
                  {deltaCopy}
                </p>
              )}
            </div>
            <div className="bg-surface-soft p-4">
              <p className="eyebrow-label">Price band</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{offer.price_band || 'Pending'}</p>
            </div>
            <div className="bg-surface-soft p-4">
              <p className="eyebrow-label">Brand</p>
              <p className="mt-2 text-base font-semibold text-foreground">{offer.brand || 'Unspecified'}</p>
            </div>
            <div className="bg-surface-soft p-4">
              <p className="eyebrow-label">Freshness</p>
              <p className="mt-2 text-base font-semibold text-foreground">
                {formatCompactDate(offer.last_seen_at)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Market quote history for this cluster */}
      <RevealSection>
        <div className="fp-panel space-y-4">
          <p className="eyebrow-label">Market price history</p>
          <p className="text-sm text-muted-foreground">
            Official wet-market quotes matched to {offer.canonical_name}.
          </p>
          {marketTrendQuery.isLoading ? (
            <LoadingBlock message="Loading market trend..." />
          ) : marketTrendChartData.length > 1 ? (
            <motion.div
              className="h-56 w-full"
              role="img"
              aria-label={`Market price trend for ${offer.canonical_name}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketTrendChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="offerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="period" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#f5f5f5', fontSize: 12 }}
                    formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, 'Avg price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#offerGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#f97316' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="mt-2 text-xs text-muted-foreground">
                {marketTrendQuery.data?.total_data_points ?? 0} indexed market quotes
              </p>
            </motion.div>
          ) : (
            <EmptyState
              title="No market history for this item yet"
              description="We could not find enough official market quotes to plot a series for this cluster."
              hint="The retail price above is the latest indexed signal; check markets for related commodities."
              actionLabel="Open markets"
              actionTo="/markets"
            />
          )}
        </div>
      </RevealSection>

      {/* Provenance + meta */}
      <RevealSection delay={80}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="fp-soft-card space-y-2">
            <p className="eyebrow-label">Per unit price</p>
            <p className="num text-xl font-semibold text-foreground">
              {offer.price_per_unit_lkr ? `Rs ${formatCurrency(offer.price_per_unit_lkr)}` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              Normalised as {offer.normalized_unit_amount ?? offer.unit_amount ?? '—'} {offer.normalized_unit ?? offer.unit ?? ''}; source unit {offer.original_unit_text || 'not supplied'}.
            </p>
          </div>
          <div className="fp-soft-card space-y-2">
            <p className="eyebrow-label">Median delta</p>
            <p className={`num text-xl font-semibold ${isCheap ? 'text-emerald-400' : isExpensive ? 'text-red-400' : 'text-foreground'}`}>
              {deltaCopy}
            </p>
            <p className="text-xs text-muted-foreground">
              Normalisation confidence {(offer.normalization_confidence * 100).toFixed(0)}%.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* Decision support */}
      <RevealSection delay={120}>
        <div
          className="rounded-card border p-5"
          style={{ borderColor: 'rgba(249,115,22,0.15)', background: 'rgba(249,115,22,0.05)' }}
        >
          <p className="eyebrow-accent mb-3">Decision support</p>
          <p className="text-sm leading-7 text-secondary-foreground">
            This offer is normalised into a comparable cluster so the platform can score it against
            nearby market signals rather than showing a raw product card in isolation.
          </p>
        </div>
      </RevealSection>

      <NextActionLinks
        title="Next actions"
        links={[
          { label: 'Build basket', to: '/basket' },
          { label: 'Review watchlists', to: '/watchlists' },
          { label: 'Open prices', to: '/prices' },
        ]}
      />

      {/* Related offers */}
      <RevealSection delay={160}>
        <section className="space-y-5">
          <SectionHeader
            eyebrow="Related"
            title="Similar offers"
            description="Nearby retail alternatives help this page feel like a workflow, not a dead end."
            level="h2"
          />
          {relatedOffers.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {relatedOffers.map((item) => (
                <OfferCard key={item.id} offer={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No related offers yet"
              description="Explore category summaries and markets to continue price discovery."
              actionLabel="Open prices"
              actionTo="/prices"
            />
          )}
        </section>
      </RevealSection>
    </section>
  )
}
