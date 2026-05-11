import type { ReactNode } from 'react'

import { BarChart3, DatabaseZap, LayoutGrid, LineChart, Soup, TimerReset } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { formatCompactDate, formatCurrency } from './lib/format'
import type { OfferItem, PipelineItem } from './types'

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutGrid },
  { to: '/explore', label: 'Explore', icon: Soup },
  { to: '/trends', label: 'Trends', icon: LineChart },
  { to: '/pipeline', label: 'Pipeline', icon: DatabaseZap },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                <Soup className="h-4 w-4" />
                Sri Lanka Food Price Intelligence
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Food Price Intelligence</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
                  Track Sri Lankan grocery pricing across approved retail sources, compare value, and monitor
                  trend shifts from one clean dashboard.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-900">
              Phase 1 sources: <span className="font-semibold">SPAR2U</span> and <span className="font-semibold">GLOMARK</span>
            </div>
          </div>
          <nav className="mt-6 flex flex-wrap gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        {children}
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </article>
  )
}

export function OfferCard({ offer }: { offer: OfferItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{offer.source}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{offer.display_name}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {offer.brand || 'Generic'} · {offer.category}
          </p>
        </div>
        {offer.price_band ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {offer.price_band}
          </span>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Current price</p>
          <p className="text-2xl font-semibold text-slate-900">Rs {formatCurrency(offer.price_lkr)}</p>
        </div>
        <div className="text-sm text-slate-600">
          {offer.unit_amount ? `${offer.unit_amount}${offer.unit || ''}` : 'Unit not normalized yet'}
        </div>
      </div>
    </article>
  )
}

export function PipelineCard({ item }: { item: PipelineItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{item.source}</h3>
          <p className="mt-1 text-sm text-slate-600">{formatCompactDate(item.finished_at)}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          {item.status}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Seen
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-900">{item.items_seen}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <TimerReset className="h-4 w-4" />
            Stored
          </div>
          <p className="mt-2 text-xl font-semibold text-slate-900">{item.items_stored}</p>
        </div>
      </div>
      {item.error_message ? <p className="mt-3 text-sm text-red-600">{item.error_message}</p> : null}
    </article>
  )
}
