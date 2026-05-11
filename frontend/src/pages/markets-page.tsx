import { useQuery } from '@tanstack/react-query'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function MarketsPage() {
  const marketQuotesQuery = useQuery({
    queryKey: ['market-quotes', 'markets-page'],
    queryFn: () => api.getMarketQuotes('?limit=12'),
  })

  if (marketQuotesQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Markets"
        title="Markets"
        description="District and market-level produce quotes now have a dedicated home in the product architecture."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {marketQuotesQuery.data?.items.map((quote) => (
          <article key={quote.id} className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{quote.district}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{quote.market_name}</h3>
            <p className="mt-1 text-sm font-medium text-slate-900">{quote.item_name}</p>
            <p className="text-sm text-slate-600">{quote.category}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-950">Rs {formatCurrency(quote.price_lkr)}</p>
            <p className="text-sm text-slate-500">per {quote.unit}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
