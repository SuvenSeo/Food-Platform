import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { LoadingBlock } from '../components/ui/loading-block'
import { SectionHeader } from '../components/ui/section-header'
import { useWatchlists } from '../hooks/use-watchlists'
import { api } from '../lib/api'
import { formatCurrency } from '../lib/format'

export function ComparePage() {
  const marketsQuery = useQuery({
    queryKey: ['market-quotes'],
    queryFn: () => api.getMarketQuotes(),
  })
  const [leftDistrict, setLeftDistrict] = useState('Colombo')
  const [rightDistrict, setRightDistrict] = useState('Kandy')
  const compareQuery = useQuery({
    queryKey: ['district-compare', leftDistrict, rightDistrict],
    queryFn: () => api.getDistrictCompare(leftDistrict, rightDistrict),
    enabled: Boolean(leftDistrict && rightDistrict),
  })
  const { saveEntry } = useWatchlists()

  const districts = useMemo(
    () => Array.from(new Set((marketsQuery.data?.items ?? []).map((item) => item.district))).sort(),
    [marketsQuery.data?.items],
  )

  if (compareQuery.isLoading || marketsQuery.isLoading) {
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
        <div className="grid gap-4 rounded-[1.5rem] bg-slate-50 p-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Left district</span>
            <select
              aria-label="Left district"
              value={leftDistrict}
              onChange={(event) => setLeftDistrict(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Right district</span>
            <select
              aria-label="Right district"
              value={rightDistrict}
              onChange={(event) => setRightDistrict(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            >
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
        </div>

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
                summary: `${data?.items.length ?? 0} shared produce items`,
              })
            }
            className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Save compare view
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {!data?.items.length ? (
            <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-slate-600">
              No overlapping produce items were found for the selected districts.
            </div>
          ) : null}
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
