import type { ReactNode } from 'react'

import { BarChart3, BookOpenText, DatabaseZap, LayoutGrid, Scale, ShoppingBasket, Soup, Store, Waves } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Home', icon: LayoutGrid },
  { to: '/intelligence', label: 'Intelligence', icon: BarChart3 },
  { to: '/retail', label: 'Retail', icon: Store },
  { to: '/markets', label: 'Markets', icon: Waves },
  { to: '/categories', label: 'Categories', icon: Soup },
  { to: '/compare', label: 'Compare', icon: Scale },
  { to: '/basket', label: 'Basket', icon: ShoppingBasket },
  { to: '/methods', label: 'Methods', icon: BookOpenText },
  { to: '/pipeline', label: 'Pipeline', icon: DatabaseZap },
]

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">
                <Soup className="h-4 w-4" />
                Sri Lanka Food Intelligence
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
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
            <div className="rounded-[1.5rem] border border-orange-100 bg-orange-50 px-5 py-4 text-sm text-orange-900">
              <p className="font-semibold uppercase tracking-[0.22em] text-orange-700">Current live coverage</p>
              <p className="mt-2">Retail sources, wet-market quotes, and premium summary surfaces.</p>
            </div>
          </div>

          <nav className="mt-8 flex flex-wrap gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
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
          </nav>
        </header>

        <main>{children}</main>
      </div>
    </div>
  )
}
