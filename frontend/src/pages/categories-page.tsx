import { useQuery } from '@tanstack/react-query'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function CategoriesPage() {
  const categoriesQuery = useQuery({
    queryKey: ['categories-summary'],
    queryFn: api.getCategoriesSummary,
  })

  if (categoriesQuery.isLoading) {
    return <LoadingBlock />
  }

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Categories"
        title="Category intelligence"
        description="Real category coverage, retail depth, and market quote breadth rendered from server-side summaries."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {categoriesQuery.data?.items.map((category) => (
          <article
            key={category.category}
            className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-[0_20px_45px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Category</p>
            <h3 className="mt-3 text-xl font-semibold capitalize text-slate-950">{category.category}</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
              <p>Retail offers {category.retail_offers_count}</p>
              <p>Market quotes {category.market_quotes_count}</p>
              {category.retail_median_lkr ? <p>Retail median Rs {formatCurrency(category.retail_median_lkr)}</p> : null}
              {category.market_average_lkr ? <p>Market average Rs {formatCurrency(category.market_average_lkr)}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
