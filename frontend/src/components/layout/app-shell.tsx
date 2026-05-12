import { type ReactNode, useState } from 'react'
import {
  BarChart3, BookOpenText, Bookmark, DatabaseZap,
  LayoutGrid, Scale, ShoppingBasket, Soup, Store, Waves, Menu, X,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useMotionTemplate, AnimatePresence } from 'framer-motion'

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
        `relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
          isActive ? 'text-[#f5f5f5]' : 'text-[#737373] hover:text-[#a3a3a3]'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-pill"
              className="absolute inset-0 rounded-full bg-white/[0.09] border border-white/[0.12]"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <Icon className="relative h-3.5 w-3.5" aria-hidden="true" />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
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

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-72 flex-col border-l"
            style={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.08)' }}
            aria-modal="true"
            role="dialog"
            aria-label="Navigation menu"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b p-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-500/25">
                  <Soup className="h-4 w-4 text-orange-400" aria-hidden="true" />
                </div>
                <span className="text-base font-semibold text-[#f5f5f5]" style={{ fontFamily: '"DM Serif Display", serif' }}>
                  FoodLens
                </span>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#737373] transition hover:bg-white/[0.06] hover:text-[#f5f5f5]"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav items */}
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
                        : 'text-[#737373] hover:bg-white/[0.05] hover:text-[#f5f5f5]'
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

function MorphingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { scrollY } = useScroll()

  const borderRadius = useTransform(scrollY, [0, 120], ['28px', '9999px'])
  const paddingX = useTransform(scrollY, [0, 120], ['1.5rem', '1.25rem'])
  const paddingY = useTransform(scrollY, [0, 120], ['1.25rem', '0.625rem'])
  const maxWidth = useTransform(scrollY, [0, 120], ['100%', '960px'])
  const marginTop = useTransform(scrollY, [0, 120], ['0px', '12px'])
  const bgAlpha = useTransform(scrollY, [0, 80], [0.85, 0.97])
  const borderAlpha = useTransform(scrollY, [0, 80], [0.08, 0.15])

  const springRadius = useSpring(borderRadius, { stiffness: 200, damping: 30 })
  const springPX = useSpring(paddingX, { stiffness: 200, damping: 30 })
  const springPY = useSpring(paddingY, { stiffness: 200, damping: 30 })
  const springMaxW = useSpring(maxWidth, { stiffness: 200, damping: 30 })
  const springMT = useSpring(marginTop, { stiffness: 200, damping: 30 })

  // Reactive motion-template strings — update every scroll frame without React re-renders
  const backgroundColor = useMotionTemplate`rgba(10,10,10,${bgAlpha})`
  const borderColor = useMotionTemplate`rgba(255,255,255,${borderAlpha})`

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
      <div className="sticky top-0 z-50 flex justify-center px-4 sm:px-6">
        <motion.header
          aria-label="Site header"
          style={{
            borderRadius: springRadius,
            paddingLeft: springPX,
            paddingRight: springPX,
            paddingTop: springPY,
            paddingBottom: springPY,
            maxWidth: springMaxW,
            marginTop: springMT,
            width: '100%',
            backgroundColor,
            borderColor,
            backdropFilter: 'blur(20px) saturate(120%)',
            WebkitBackdropFilter: 'blur(20px) saturate(120%)',
            borderWidth: '1px',
            borderStyle: 'solid',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Brand */}
            <NavLink to="/" className="flex shrink-0 items-center gap-2.5" aria-label="FoodLens home">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-500/25">
                <Soup className="h-4 w-4 text-orange-400" aria-hidden="true" />
              </div>
              <span
                className="hidden text-base font-semibold text-[#f5f5f5] sm:block"
                style={{ fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.02em' }}
              >
                FoodLens
              </span>
            </NavLink>

            {/* Desktop nav — horizontal scroll, no wrap; show at sm+ (640px) */}
            <nav
              aria-label="Site navigation"
              className="hidden min-w-0 flex-1 sm:flex"
            >
              <div className="flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {navItems.map((item) => (
                  <NavPill key={item.to} {...item} />
                ))}
              </div>
            </nav>

            {/* Spacer for mobile */}
            <div className="flex-1 sm:hidden" />

            {/* Right side: freshness + mobile toggle */}
            <div className="flex shrink-0 items-center gap-2">
              {freshness && (
                <span className={`hidden md:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${confidenceTone}`}>
                  <span className="live-dot-orange" aria-hidden="true" />
                  <span aria-label={`Data confidence score: ${freshness.confidence.score} out of 100`}>
                    {freshness.confidence.score}/100
                  </span>
                </span>
              )}

              {/* Mobile hamburger — visible below sm (640px) */}
              <button
                onClick={() => setMobileOpen(true)}
                className="sm:hidden flex h-8 w-8 items-center justify-center rounded-full text-[#a3a3a3] transition hover:bg-white/[0.08] hover:text-[#f5f5f5] border"
                style={{ borderColor: 'rgba(255,255,255,0.10)' }}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                aria-haspopup="dialog"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.header>
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
        <MorphingHeader />

        <main id="main-content" className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-8 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
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
