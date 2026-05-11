import { useQuery } from '@tanstack/react-query'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function ComparePage() {
  const compareQuery = useQuery({
    queryKey: ['district-compare', 'Colombo', 'Kandy'],
    queryFn: () => api.getDistrictCompare('Colombo', 'Kandy'),
  })
  const { saveEntry } = useWatchlists()

  if (compareQuery.isLoading) {
    return <LoadingBlock />
  }

  const data = compareQuery.data

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Compare"
        title="Compare stores, districts, and food clusters"
        description="The first compare workflow focuses on live district produce differences and a reusable save-to-watchlists pattern."
      />

      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold text-slate-950">
            {data?.left} vs {data?.right}
          </h3>
          <button
            type="button"
            onClick={() =>
              saveEntry({
                id: `compare-${data?.left}-${data?.right}`,
                title: `${data?.left} vs ${data?.right}`,
                kind: 'compare',
                href: '/compare',
                summary: 'District produce comparison',
              })
            }
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Save compare view
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {data?.items.map((item) => (
            <article key={item.item_name} className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">{item.item_name}</h4>
                  <p className="text-sm text-slate-600 capitalize">{item.category}</p>
                </div>
                <p className="text-sm font-medium text-emerald-700">
                  {item.cheaper_side} cheaper by Rs {formatCurrency(Math.abs(item.delta_lkr))}
                </p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">{data?.left}</p>
                  <p>Rs {formatCurrency(item.left_price_lkr)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 text-sm text-slate-600">
                  <p className="font-semibold text-slate-950">{data?.right}</p>
                  <p>Rs {formatCurrency(item.right_price_lkr)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
