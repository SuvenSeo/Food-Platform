import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'

const footerLinks = [
  { label: 'Home', to: '/' },
  { label: 'Retail', to: '/retail' },
  { label: 'Markets', to: '/markets' },
  { label: 'Intelligence', to: '/intelligence' },
  { label: 'Compare', to: '/compare' },
  { label: 'Basket', to: '/basket' },
  { label: 'Methods', to: '/methods' },
  { label: 'Developers', to: '/developers' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function SiteFooter() {
  return (
    <footer
      className="relative mt-16 border-t"
      style={{ borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0a0a0a' }}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid gap-12 lg:grid-cols-[1.4fr_1fr]"
        >
          {/* Brand col */}
          <motion.div variants={itemVariants}>
            {/* FoodLK Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/25">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-400">
                  <path d="M6 17a10 10 0 0 0 20 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <line x1="4" y1="17" x2="28" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                  <path d="M16 6 C13 9 11 11 12 15 C13 17.5 19 17.5 20 14 C21.5 10 19 7 16 6Z" fill="currentColor"/>
                </svg>
              </div>
              <span
                className="text-2xl text-white/90"
                style={{ fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.03em' }}
              >
                FoodLK
              </span>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-[#737373]">
              Sri Lanka's food price intelligence platform — retail offers, wet market signals,
              historical price trends, and basket tracking from official government and market sources.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-pill bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20">
                <span className="live-dot-orange" />
                Live data
              </span>
              <span className="text-xs text-[#404040]">Sri Lanka · Updated daily</span>
            </div>
          </motion.div>

          {/* Links col */}
          <motion.div variants={itemVariants}>
            <p className="eyebrow-label mb-5">Platform</p>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-[#737373] transition-colors hover:text-[#f5f5f5]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-12 flex flex-col items-start justify-between gap-4 border-t pt-8 sm:flex-row sm:items-center"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs text-[#404040]">
            © {new Date().getFullYear()} FoodLK · Ardeno Studio. All rights reserved.
          </p>
          <p className="text-xs text-[#404040]">
            Sri Lanka's open food price intelligence platform
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
