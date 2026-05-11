import { useQuery } from '@tanstack/react-query'
import { ArrowRight, LoaderCircle, Sparkles, TrendingUp } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { OfferCard, PipelineCard, StatCard } from './components'
import { api } from './lib/api'
import { formatCompactDate, formatCurrency } from './lib/format'

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">
      <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
      Loading dashboard data...
    </div>
  )
}

export function HomePage() {
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: api.getStats })
  const offersQuery = useQuery({ queryKey: ['offers', 'featured'], queryFn: () => api.getOffers('?limit=3') })
  const pipelineQuery = useQuery({ queryKey: ['pipeline'], queryFn: api.getPipeline })

  if (statsQuery.isLoading || offersQuery.isLoading || pipelineQuery.isLoading) {
    return <LoadingBlock />
  }

  const stats = statsQuery.data
  const offers = offersQuery.data?.items ?? []
  const pipelineItems = pipelineQuery.data?.items ?? []

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Offers indexed" value={formatCurrency(stats?.offers_count)} helper="Active normalized offers in the latest view." />
        <StatCard label="Sources tracked" value={formatCurrency(stats?.sources_count)} helper="Approved retail sources feeding the dashboard." />
        <StatCard
          label="Categories covered"
          value={formatCurrency(stats?.categories_count)}
          helper={stats?.last_scrape_at ? `Last scrape: ${formatCompactDate(stats.last_scrape_at)}` : 'No scrape run yet.'}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr,0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-orange-700">
                <Sparkles className="h-4 w-4" />
                Value spotlight
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Cheapest comparable items surfaced automatically</h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Explore offers
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-orange-700">
            <TrendingUp className="h-4 w-4" />
            Pipeline pulse
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent ingestion health</h2>
          <div className="mt-5 space-y-4">
            {pipelineItems.slice(0, 2).map((item) => (
              <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Life platform federation path</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Phase 1 stays read-only and link-based: this app exposes stable JSON for hub consumption while the sibling
          platforms remain independent until shared auth is worth the complexity.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ['Property', 'https://propertylk-one.vercel.app/'],
            ['Vehicle', 'https://vehicle-platform-one.vercel.app/'],
            ['Octane', 'https://octane-smoky.vercel.app/'],
          ].map(([label, url]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-slate-900"
            >
              {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export function ExplorePage() {
  const offersQuery = useQuery({ queryKey: ['offers', 'browse'], queryFn: () => api.getOffers('?category=grocery&limit=12') })

  if (offersQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">Explore offers</h2>
        <p className="mt-2 text-slate-600">Browse normalized grocery offers and compare prices across sources.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {offersQuery.data?.items.map((offer) => (
          <Link key={offer.id} to={`/offers/${offer.id}`} className="block">
            <OfferCard offer={offer} />
          </Link>
        ))}
      </div>
    </section>
  )
}

export function TrendsPage() {
  const trendsQuery = useQuery({ queryKey: ['trends', 'grocery'], queryFn: () => api.getTrends('grocery') })
  const marketQuotesQuery = useQuery({
    queryKey: ['market-quotes', 'vegetables'],
    queryFn: () => api.getMarketQuotes('?category=vegetables&limit=6'),
  })

  if (trendsQuery.isLoading || marketQuotesQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">Trend snapshots</h2>
        <p className="mt-2 text-slate-600">Cluster medians are ready for charts and Life Platform federation.</p>
      </div>
      <div className="grid gap-4">
        {trendsQuery.data?.items.map((item) => (
          <article key={item.cluster_key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{item.brand ? `${item.brand} ` : ''}{item.canonical_name}</h3>
                <p className="text-sm text-slate-600">
                  {item.offers_count} offers · {item.unit_amount || 'N/A'}{item.unit || ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Median</p>
                <p className="text-2xl font-semibold text-slate-900">Rs {formatCurrency(item.median_price_lkr)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-slate-900">District produce watch</h3>
        <p className="mt-2 text-slate-600">Wet-market style produce quotes grouped by district and market.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {marketQuotesQuery.data?.items.map((quote) => (
          <article key={quote.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{quote.district}</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900">{quote.market_name}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  {quote.item_name} · {quote.category}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Quoted price</p>
                <p className="text-2xl font-semibold text-slate-900">Rs {formatCurrency(quote.price_lkr)}</p>
                <p className="text-sm text-slate-500">per {quote.unit}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PipelinePage() {
  const pipelineQuery = useQuery({ queryKey: ['pipeline', 'page'], queryFn: api.getPipeline })

  if (pipelineQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">Pipeline status</h2>
        <p className="mt-2 text-slate-600">Operational view for scraper runs and data freshness.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {pipelineQuery.data?.items.map((item) => (
          <PipelineCard key={`${item.source}-${item.finished_at}`} item={item} />
        ))}
      </div>
    </section>
  )
}

export function OfferDetailPage() {
  const { offerId } = useParams()
  const offerQuery = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => api.getOffer(offerId || ''),
    enabled: Boolean(offerId),
  })

  if (offerQuery.isLoading) {
    return <LoadingBlock />
  }

  if (!offerQuery.data) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Offer not found.</div>
  }

  const offer = offerQuery.data

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Link to="/explore" className="text-sm font-medium text-orange-700">
        Back to explore
      </Link>
      <h2 className="mt-4 text-3xl font-semibold text-slate-900">{offer.display_name}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Current price</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">Rs {formatCurrency(offer.price_lkr)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Price band</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{offer.price_band || 'Pending'}</p>
        </div>
      </div>
    </section>
  )
}
