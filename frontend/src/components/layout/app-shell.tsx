import { type ReactNode, useEffect, useState } from 'react'
import {
  BarChart3, BookOpenText, Bookmark, DatabaseZap, History,
  LayoutGrid, Scale, Search, ShoppingBasket, Soup, Store, Waves, Menu, X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { usePlatformFreshness } from '../../hooks/use-platform-freshness'
import { NoiseOverlay } from '../ui/noise-overlay'
import { ScrollProgressBar } from '../ui/scroll-progress-bar'
import { AppLoader } from '../ui/app-loader'
import { CommandSearch } from './command-search'
import { useCommandSearch } from '../../hooks/use-command-search'
import { MobileMoversStrip } from './mobile-movers-strip'
import { SiteFooter } from './site-footer'
import { cn } from '../../lib/utils'
import type { PlatformFreshnessSummary } from '../../types'

/** Routes that flip the entire app to night-terminal mode. */
const NIGHT_ROUTES = new Set(['/intelligence', '/pipeline', '/changes'])

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

/** Masthead glyph — a stylized scale / wet-market measure */
function FoodLKIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* paper bowl */}
      <path d="M5 14 H27 L24 24 H8 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      {/* steam */}
      <path d="M11 9 C12 7 10 6 11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 10 C17 8 15 7 16 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M21 9 C22 7 20 6 21 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* chili dot */}
      <circle cx="16" cy="19" r="1.6" fill="currentColor" />
    </svg>
  )
}

function NavPill({ to, label, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'relative inline-flex shrink-0 items-baseline gap-1.5 px-0.5 py-1 font-display text-[15px] tracking-[-0.01em] transition-colors duration-200',
          isActive
            ? "text-[color:var(--chili-500)] before:content-['§'] before:mr-1 before:font-serif before:italic"
            : 'text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-text-primary)]',
        )
      }
    >
      <span>{label}</span>
    </NavLink>
  )
}

function Dateline({ freshness }: { freshness: PlatformFreshnessSummary | undefined }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const day = now.toLocaleDateString('en-LK', { weekday: 'short' }).toUpperCase()
  const date = now.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
  const time = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', hour12: false })

  const offers = freshness?.coverage.offers_count
  const sources = freshness?.pipeline
  const grade = freshness?.confidence.grade
  const gradeDot =
    grade === 'high' ? 'bg-[color:var(--curry-leaf)]'
    : grade === 'medium' ? 'bg-[color:var(--turmeric-deep)]'
    : 'bg-[color:var(--chili-600)]'

  return (
    <div className="dateline overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="font-bold text-[color:var(--color-text-primary)]">{day} · {date}</span>
      <span className="dateline-sep">COLOMBO</span>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot', gradeDot)} aria-hidden="true" />
        EDITION No.<span className="num text-[color:var(--color-text-primary)]">{Math.floor((Date.now() / 86400000) % 9999)}</span>
      </span>
      {sources && (
        <span className="dateline-sep">
          <span className="num text-[color:var(--color-text-primary)]">{sources.healthy_sources}/{sources.total_sources}</span> sources live
        </span>
      )}
      {typeof offers === 'number' && (
        <span className="dateline-sep">
          <span className="num text-[color:var(--color-text-primary)]">{offers.toLocaleString()}</span> offers indexed
        </span>
      )}
      <span className="dateline-sep ml-auto">
        <span className="num text-[color:var(--color-text-primary)]">{time}</span> LK
      </span>
    </div>
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
                            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300',
                            isActive
                              ? 'bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/30 shadow-[0_0_20px_-4px_rgba(249,115,22,0.2)]'
                              : 'text-muted-foreground hover:bg-white/[0.08] hover:text-foreground',
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

function MandiyaMasthead() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const command = useCommandSearch()
  const freshnessQuery = usePlatformFreshness()

  return (
    <>
      {/* — Black masthead bar — */}
      <div className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-[color:var(--ink-900)] text-[color:var(--paper-100)]">
        <div className="mx-auto flex max-w-[1320px] items-center gap-4 px-4 py-2.5 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="FoodLK home">
            <FoodLKIcon className="h-6 w-6 text-[color:var(--turmeric)]" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-[19px] font-bold tracking-[-0.025em] leading-none">
                MANDIYA<span className="text-[color:var(--turmeric)]">.</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-400)] hidden sm:inline">
                Food&nbsp;Intelligence · LK
              </span>
            </div>
          </NavLink>

          <div className="hidden h-5 w-px shrink-0 bg-white/15 sm:block" />

          <div className="hidden flex-1 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--paper-400)] md:flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--turmeric)] animate-pulse-dot" aria-hidden="true" />
            <span>Vol.&nbsp;01 · No.&nbsp;{Math.floor((Date.now() / 86400000) % 9999)}</span>
          </div>

          <button
            type="button"
            onClick={() => command.setOpen(true)}
            className="inline-flex items-center gap-2 rounded-none border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-[color:var(--paper-200)] transition hover:border-[color:var(--turmeric)] hover:text-[color:var(--turmeric)]"
            aria-label="Open command search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-mono uppercase tracking-[0.18em]">Search</span>
            <kbd className="hidden md:inline rounded-sm border border-white/15 px-1.5 py-0.5 font-mono text-[9px] tracking-normal">⌘K</kbd>
          </button>

          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center border border-white/15 text-[color:var(--paper-200)] transition hover:border-[color:var(--turmeric)] hover:text-[color:var(--turmeric)] lg:hidden"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-haspopup="dialog"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* — Dateline strip — */}
      <div className="border-b border-[color:var(--color-border-hover)]">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
          <Dateline freshness={freshnessQuery.data} />
        </div>
      </div>

      {/* — Section index nav — */}
      <nav
        aria-label="Site sections"
        className="hidden border-b-2 border-[color:var(--color-text-primary)] lg:block"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, transparent calc(100% - 6px), var(--color-text-primary) calc(100% - 6px), var(--color-text-primary) calc(100% - 5px), transparent calc(100% - 5px))',
        }}
      >
        <div className="mx-auto flex max-w-[1320px] items-center gap-6 overflow-x-auto px-4 py-3 sm:px-6">
          {flatNav.map((item, i) => (
            <span key={item.to} className="flex items-baseline gap-6">
              <NavPill {...item} />
              {i < flatNav.length - 1 && (
                <span className="text-[color:var(--ink-200)]" aria-hidden="true">/</span>
              )}
            </span>
          ))}
        </div>
      </nav>

      <CommandSearch open={command.open} onClose={command.close} />
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  /** Flip the entire app palette for terminal-y pages. */
  useEffect(() => {
    const isNight = NIGHT_ROUTES.has(location.pathname)
    document.documentElement.setAttribute('data-theme', isNight ? 'night' : 'paper')
  }, [location.pathname])

  return (
    <AppLoader>
      <div className="min-h-screen bg-background">
        <NoiseOverlay />
        <ScrollProgressBar />
        <MandiyaMasthead />

        <main id="main-content" className="mx-auto max-w-[1320px] px-4 pb-28 pt-8 sm:px-6 sm:pb-24 lg:pt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6, rotateX: -2 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'top center', transformStyle: 'preserve-3d' }}
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
