import { type ReactNode, useState } from 'react'
import {
  BarChart3, BookOpenText, Bookmark, DatabaseZap,
  LayoutGrid, Scale, ShoppingBasket, Soup, Store, Waves, Menu, X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { usePlatformFreshness } from '../../hooks/use-platform-freshness'
import { NoiseOverlay } from '../ui/noise-overlay'
import { ScrollProgressBar } from '../ui/scroll-progress-bar'
import { AppLoader } from '../ui/app-loader'
import { SiteFooter } from './site-footer'

const navItems = [
  { to: '/', label: 'Home', icon: LayoutGrid, end: true },
  { to: '/retail', label: 'Retail', icon: Store, end: false },
  { to: '/markets', label: 'Markets', icon: Waves, end: false },
  { to: '/categories', label: 'Categories', icon: Soup, end: false },
  { to: '/compare', label: 'Compare', icon: Scale, end: false },
  { to: '/intelligence', label: 'Intelligence', icon: BarChart3, end: false },
  { to: '/pipeline', label: 'Pipeline', icon: DatabaseZap, end: false },
  { to: '/basket', label: 'Basket', icon: ShoppingBasket, end: false },
  { to: '/watchlists', label: 'Watchlists', icon: Bookmark, end: false },
  { to: '/methods', label: 'Methods', icon: BookOpenText, end: false },
]

function NavPill({ to, label, icon: Icon, end }: typeof navItems[0]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
          isActive
            ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/25'
            : 'text-[#c8c8c8] hover:text-white hover:bg-white/[0.07]'
        }`
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
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
            className="fixed right-0 top-0 z-[70] flex h-full w-72 flex-col"
            style={{ backgroundColor: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between border-b p-5"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-500/25">
                  <FoodLKIcon className="h-4 w-4" />
                </div>
                <span className="text-base font-semibold text-white" style={{ fontFamily: '"DM Serif Display", serif' }}>
                  FoodLK
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#737373] hover:bg-white/[0.06] hover:text-white transition"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 overflow-y-auto p-4" aria-label="Site navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20'
                        : 'text-[#c8c8c8] hover:bg-white/[0.05] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-orange-400' : ''}`} aria-hidden="true" />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/** FoodLK branded icon — flame-in-bowl shape in orange */
function FoodLKIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="16" cy="16" r="16" fill="currentColor" fillOpacity="0.15" />
      {/* Bowl shape */}
      <path d="M7 17a9 9 0 0 0 18 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="17" x2="27" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Flame / steam */}
      <path
        d="M16 8 C14 10 12 11 13 14 C14 16 18 16 19 13 C20 10 18 9 16 8Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  )
}

function PlatformNav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const freshnessQuery = usePlatformFreshness()
  const freshness = freshnessQuery.data
  const confidenceGrade = freshness?.confidence.grade ?? 'medium'
  const confidenceTone =
    confidenceGrade === 'high'
      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25'
      : confidenceGrade === 'low'
      ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25'
      : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25'

  return (
    <>
      {/* Floating pill navbar — always visible, centered at top */}
      <div className="sticky top-3 z-50 flex justify-center px-4">
        <nav
          aria-label="Site header"
          className="flex w-full max-w-[1180px] items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: 'rgba(8, 8, 8, 0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px) saturate(150%)',
            WebkitBackdropFilter: 'blur(24px) saturate(150%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          {/* Brand */}
          <NavLink
            to="/"
            className="flex shrink-0 items-center gap-2 mr-1"
            aria-label="FoodLK home"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
              <FoodLKIcon className="h-4 w-4" />
            </div>
            <span
              className="text-sm font-semibold text-white hidden sm:block"
              style={{ fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.01em' }}
            >
              FoodLK
            </span>
          </NavLink>

          {/* Divider */}
          <div className="h-5 w-px shrink-0 hidden sm:block" style={{ background: 'rgba(255,255,255,0.10)' }} />

          {/* Desktop nav — horizontal, no wrap, overflow-scroll */}
          <div className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-0.5 px-1">
              {navItems.map((item) => (
                <NavPill key={item.to} {...item} />
              ))}
            </div>
          </div>

          {/* Right: confidence badge + mobile toggle */}
          <div className="flex shrink-0 items-center gap-2 ml-1">
            {freshness && (
              <span
                className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${confidenceTone}`}
                aria-label={`Data confidence: ${freshness.confidence.score} out of 100`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
                {freshness.confidence.score}/100
              </span>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-[#c8c8c8] border border-white/[0.12] transition hover:bg-white/[0.08] hover:text-white sm:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              aria-haspopup="dialog"
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <AppLoader>
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <NoiseOverlay />
        <ScrollProgressBar />
        <PlatformNav />

        <main id="main-content" className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6 pb-24">
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

        <SiteFooter />
      </div>
    </AppLoader>
  )
}
