import type { ReactNode } from 'react'

import { BarChart3, BookOpenText, Bookmark, DatabaseZap, LayoutGrid, Scale, ShoppingBasket, Soup, Store, Waves } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { usePlatformFreshness } from '../../hooks/use-platform-freshness'
import { formatCompactDate } from '../../lib/format'
import { SiteFooter } from './site-footer'

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Home', icon: LayoutGrid }],
  },
  {
    label: 'Discovery',
    items: [
      { to: '/retail', label: 'Retail', icon: Store },
      { to: '/markets', label: 'Markets', icon: Waves },
      { to: '/categories', label: 'Categories', icon: Soup },
      { to: '/compare', label: 'Compare', icon: Scale },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/intelligence', label: 'Intelligence', icon: BarChart3 },
      { to: '/pipeline', label: 'Pipeline', icon: DatabaseZap },
    ],
  },
  {
    label: 'Utilities',
    items: [
      { to: '/basket', label: 'Basket', icon: ShoppingBasket },
      { to: '/watchlists', label: 'Watchlists', icon: Bookmark },
      { to: '/methods', label: 'Methods', icon: BookOpenText },
    ],
  },
]

export function AppShell({ children }: { children: ReactNode }) {
  const freshnessQuery = usePlatformFreshness()
  const freshness = freshnessQuery.data
  const confidenceGrade = freshness?.confidence.grade ?? 'medium'
  const confidenceTone =
    confidenceGrade === 'high'
      ? 'text-emerald-700 bg-emerald-50 ring-emerald-100'
      : confidenceGrade === 'low'
      ? 'text-rose-700 bg-rose-50 ring-rose-100'
      : 'text-amber-700 bg-amber-50 ring-amber-100'

  return (
    <div className="min-h-screen text-slate-950">
      <div className="app-container flex flex-col gap-8 py-6 sm:px-2">
        <header className="surface-shell p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700 ring-1 ring-orange-100">
                <Soup className="h-4 w-4" />
                Sri Lanka Food Intelligence
              </div>
              <div>
                <p className="eyebrow-label text-slate-500">
                  National price signals
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Food prices, markets, and household signals in one premium intelligence platform.
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  Follow Sri Lankan grocery and wet-market pricing with richer comparisons, stronger signal design,
                  and practical tools that grow into the wider life platform over time.
                </p>
              </div>
            </div>
            <div className="surface-panel border-orange-100 bg-orange-50 px-5 py-4 text-sm text-orange-900 lg:max-w-sm">
              <p className="font-semibold uppercase tracking-[0.22em] text-orange-700">Trust and freshness</p>
              {freshnessQuery.isLoading ? (
                <p className="mt-2">Checking latest source activity and confidence signals...</p>
              ) : freshness ? (
                <div className="mt-2 space-y-3">
                  <p className="text-orange-900">
                    Last scrape {formatCompactDate(freshness.freshness.last_scrape_at)} across {freshness.coverage.sources_count} sources.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${confidenceTone}`}>
                      Confidence {freshness.confidence.score}/100
                    </span>
                    <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-orange-100">
                      Latency{' '}
                      {freshness.freshness.scrape_latency_minutes != null
                        ? `${freshness.freshness.scrape_latency_minutes}m`
                        : 'unknown'}
                    </span>
                    <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-orange-100">
                      Offers {freshness.coverage.offers_count.toLocaleString()}
                    </span>
                    <span className="inline-flex rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-orange-100">
                      Market quotes {freshness.coverage.market_quotes_count.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-orange-900/80">{freshness.confidence.note}</p>
                  <p className="text-xs text-orange-900/80">
                    Pipeline {freshness.pipeline.healthy_sources}/{freshness.pipeline.total_sources} healthy sources
                    {freshness.pipeline.latest_status ? ` (${freshness.pipeline.latest_status})` : ''}.
                  </p>
                </div>
              ) : (
                <p className="mt-2">Freshness service is temporarily unavailable. Core data views remain active.</p>
              )}
            </div>
          </div>

          <nav className="mt-8 space-y-4">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                          isActive
                            ? 'bg-slate-950 text-white shadow-sm'
                            : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </header>

        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  )
}
