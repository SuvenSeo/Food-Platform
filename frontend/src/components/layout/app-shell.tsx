import type { ReactNode } from 'react'
import { useRef } from 'react'
import {
  BarChart3, BookOpenText, Bookmark, DatabaseZap,
  LayoutGrid, Scale, ShoppingBasket, Soup, Store, Waves,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'

import { usePlatformFreshness } from '../../hooks/use-platform-freshness'
import { NoiseOverlay } from '../ui/noise-overlay'
import { ScrollProgressBar } from '../ui/scroll-progress-bar'
import { AppLoader } from '../ui/app-loader'
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

function MorphingHeader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  
  const borderRadius = useTransform(scrollY, [0, 120], ['28px', '9999px'])
  const paddingX = useTransform(scrollY, [0, 120], ['1.5rem', '1.25rem'])
  const paddingY = useTransform(scrollY, [0, 120], ['1.25rem', '0.625rem'])
  const maxWidth = useTransform(scrollY, [0, 120], ['100%', '960px'])
  const marginTop = useTransform(scrollY, [0, 120], ['0px', '12px'])

  const springRadius = useSpring(borderRadius, { stiffness: 200, damping: 30 })
  const springPX = useSpring(paddingX, { stiffness: 200, damping: 30 })
  const springPY = useSpring(paddingY, { stiffness: 200, damping: 30 })
  const springMaxW = useSpring(maxWidth, { stiffness: 200, damping: 30 })
  const springMT = useSpring(marginTop, { stiffness: 200, damping: 30 })
  const bgOpacity = useTransform(scrollY, [0, 80], [0.85, 0.96])
  const borderOpacity = useTransform(scrollY, [0, 80], [0.08, 0.14])

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
    <div
      ref={containerRef}
      className="sticky top-0 z-50 flex justify-center px-4 sm:px-6"
    >
      <motion.header
        style={{
          borderRadius: springRadius,
          paddingLeft: springPX,
          paddingRight: springPX,
          paddingTop: springPY,
          paddingBottom: springPY,
          maxWidth: springMaxW,
          marginTop: springMT,
          width: '100%',
          backgroundColor: `rgba(10,10,10,${bgOpacity.get()})`,
          borderColor: `rgba(255,255,255,${borderOpacity.get()})`,
          backdropFilter: 'blur(20px) saturate(120%)',
          WebkitBackdropFilter: 'blur(20px) saturate(120%)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 ring-1 ring-orange-500/25">
              <Soup className="h-4 w-4 text-orange-400" />
            </div>
            <span
              className="text-base font-semibold text-[#f5f5f5] hidden sm:block"
              style={{ fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.02em' }}
            >
              FoodLens
            </span>
          </NavLink>

          {/* Scrolled-state: compact nav pills */}
          <nav className="flex flex-wrap items-center gap-1">
            {navGroups.flatMap((g) => g.items).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-[#f5f5f5]'
                      : 'text-[#737373] hover:text-[#a3a3a3]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-pill bg-white/[0.09] border border-white/[0.12]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className="relative h-3.5 w-3.5" />
                    <span className="relative hidden sm:inline">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Freshness badge */}
          {freshness && (
            <div className="hidden lg:flex shrink-0 items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${confidenceTone}`}>
                <span className="live-dot-orange" />
                {freshness.confidence.score}/100
              </span>
            </div>
          )}
        </div>
      </motion.header>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppLoader>
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <NoiseOverlay />
        <ScrollProgressBar />
        <MorphingHeader />

        <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-8 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : ''}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
