import { type ReactNode, useState } from 'react'
import {
  BarChart3, BookOpenText, Bookmark, DatabaseZap, History,
  LayoutGrid, Scale, Search, ShoppingBasket, Soup, Store, Waves, Menu, X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { TrustRibbon } from '../primitives/trust-ribbon'
import { usePlatformFreshness } from '../../hooks/use-platform-freshness'
import { NoiseOverlay } from '../ui/noise-overlay'
import { ScrollProgressBar } from '../ui/scroll-progress-bar'
import { AppLoader } from '../ui/app-loader'
import { CommandSearch } from './command-search'
import { useCommandSearch } from '../../hooks/use-command-search'
import { MobileMoversStrip } from './mobile-movers-strip'
import { SiteFooter } from './site-footer'
import { cn } from '../../lib/utils'

const navGroups = [
  {
    label: 'Discover',
    items: [
      { to: '/', label: 'Home', icon: LayoutGrid, end: true },
      { to: '/retail', label: 'Retail', icon: Store, end: false },
      { to: '/markets', label: 'Markets', icon: Waves, end: false },
      { to: '/categories', label: 'Categories', icon: Soup, end: false },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/intelligence', label: 'Intelligence', icon: BarChart3, end: false },
      { to: '/changes', label: 'Changes', icon: History, end: false },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/compare', label: 'Compare', icon: Scale, end: false },
      { to: '/basket', label: 'Basket', icon: ShoppingBasket, end: false },
      { to: '/watchlists', label: 'Watchlists', icon: Bookmark, end: false },
    ],
  },
  {
    label: 'Trust',
    items: [
      { to: '/pipeline', label: 'Pipeline', icon: DatabaseZap, end: false },
      { to: '/methods', label: 'Methods', icon: BookOpenText, end: false },
    ],
  },
] as const

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutGrid
  end: boolean
}

const flatNav: NavItem[] = navGroups.flatMap((g) =>
  g.items.map((item) => ({ ...item })),
)

function NavPill({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150',
          isActive
            ? 'bg-brand-500/15 text-brand-400 ring-1 ring-brand-500/25'
            : 'text-muted-foreground hover:bg-white/[0.07] hover:text-foreground',
        )
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

function FoodLKIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="16" fill="currentColor" fillOpacity="0.15" />
      <path d="M7 17a9 9 0 0 0 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="17" x2="27" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 8 C14 10 12 11 13 14 C14 16 18 16 19 13 C20 10 18 9 16 8Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-72 flex-col border-l border-border bg-surface-soft"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25 text-brand-400">
                  <FoodLKIcon className="h-4 w-4" />
                </div>
                <span className="font-display text-base font-semibold text-foreground">FoodLK</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-4 overflow-y-auto p-4" aria-label="Site navigation">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="eyebrow-label mb-2 px-2">{group.label}</p>
                  <div className="flex flex-col gap-1">
                    {group.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20'
                              : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={cn('h-4 w-4', isActive && 'text-brand-400')}
                              aria-hidden="true"
                            />
                            {item.label}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function PlatformNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const command = useCommandSearch()
  const freshnessQuery = usePlatformFreshness()

  return (
    <>
      <header className="sticky top-0 z-50 space-y-2 px-4 pt-3">
        <nav
          aria-label="Site header"
          className="mx-auto flex w-full max-w-[1180px] items-center gap-2 rounded-full border border-border bg-surface-soft/95 px-4 py-2 shadow-soft backdrop-blur-xl"
        >
          <NavLink to="/" className="mr-1 flex shrink-0 items-center gap-2" aria-label="FoodLK home">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30">
              <FoodLKIcon className="h-4 w-4" />
            </div>
            <span className="font-display hidden text-sm font-semibold text-foreground sm:block">
              FoodLK
            </span>
          </NavLink>

          <div className="hidden h-5 w-px shrink-0 bg-border sm:block" />

          <div className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="hidden items-center gap-0.5 px-1 lg:flex">
              {flatNav.map((item) => (
                <NavPill key={item.to} {...item} />
              ))}
            </div>
            <div className="flex items-center gap-0.5 px-1 lg:hidden">
              {flatNav.slice(0, 4).map((item) => (
                <NavPill key={item.to} {...item} />
              ))}
            </div>
          </div>

          <div className="ml-1 flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => command.setOpen(true)}
              className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-border-hover hover:text-foreground sm:inline-flex"
              aria-label="Open command search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Search</span>
              <kbd className="rounded bg-white/10 px-1 text-[10px]">⌘K</kbd>
            </button>

            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:bg-white/[0.08] hover:text-foreground sm:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-haspopup="dialog"
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>

        <TrustRibbon
          className="mx-auto max-w-[1180px]"
          freshness={freshnessQuery.data}
          loading={freshnessQuery.isLoading}
        />
      </header>

      <CommandSearch open={command.open} onClose={command.close} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <AppLoader>
      <div className="min-h-screen bg-background">
        <NoiseOverlay />
        <ScrollProgressBar />
        <PlatformNav />

        <main id="main-content" className="mx-auto max-w-[1200px] px-4 pb-28 pt-6 sm:px-6 sm:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileMoversStrip />
        <SiteFooter />
      </div>
    </AppLoader>
  )
}
