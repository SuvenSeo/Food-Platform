import { useQuery } from '@tanstack/react-query'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function BasketPage() {
  const basketQuery = useQuery({
    queryKey: ['basket-estimate', 'essentials'],
    queryFn: () => api.getBasketEstimate('essentials'),
  })
  const { saveEntry } = useWatchlists()

  if (basketQuery.isLoading) {
    return <LoadingBlock />
  }

  const data = basketQuery.data

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Basket"
        title="Basket workspace"
        description="A practical utility layer for household totals, substitutions, and future saved basket workflows."
      />
      <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_45px_rgba(201,111,29,0.10)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">{data?.preset.label}</h3>
            <p className="mt-2 text-base leading-7 text-slate-700">
              Estimated from the cheapest currently available retail and market signals in the preset basket.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              saveEntry({
                id: `basket-${data?.preset.id}`,
                title: data?.preset.label ?? 'Basket preset',
                kind: 'basket',
                href: '/basket',
                summary: `Rs ${formatCurrency(data?.summary.total_lkr ?? 0)}`,
              })
            }
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Save preset to watchlists
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[1.5rem] bg-white p-5">
            <p className="text-sm text-slate-500">Estimated total</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">Rs {formatCurrency(data?.summary.total_lkr ?? 0)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {data?.summary.available_items} available items · {data?.summary.missing_items} missing
            </p>
          </div>

          <div className="space-y-3">
            {data?.items.map((item) => (
              <article key={item.label} className="rounded-[1.5rem] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">{item.label}</h4>
                    <p className="text-sm text-slate-600">{item.source || 'Unavailable'}</p>
                  </div>
                  <p className="text-lg font-semibold text-slate-950">
                    {item.price_lkr === null ? 'N/A' : `Rs ${formatCurrency(item.price_lkr)}`}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
