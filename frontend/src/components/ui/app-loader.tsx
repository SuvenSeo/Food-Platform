import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// FoodLK icon inline (no lucide dep here)

const STORAGE_KEY = 'fp.has_entered'

interface AppLoaderProps {
  children: React.ReactNode
}

export function AppLoader({ children }: AppLoaderProps) {
  const [entered, setEntered] = useState(() => {
    try {
      if (new URLSearchParams(window.location.search).get('noLoader') === '1') return true
      return sessionStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return true
    }
  })
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)

  // Track all pending async work so we can cancel on unmount
  const rafRef = useRef<number | null>(null)
  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (entered) return

    const start = performance.now()
    const duration = 1600

    function tick(now: number) {
      if (!mountedRef.current) return
      const elapsed = now - start
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)

      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        t1Ref.current = setTimeout(() => {
          if (!mountedRef.current) return
          setExiting(true)
          t2Ref.current = setTimeout(() => {
            if (!mountedRef.current) return
            try {
              sessionStorage.setItem(STORAGE_KEY, '1')
            } catch {
              // sessionStorage may be unavailable in privacy mode or jsdom;
              // a missed write here just means we replay the splash next visit.
            }
            setEntered(true)
          }, 500)
        }, 200)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (t1Ref.current !== null) clearTimeout(t1Ref.current)
      if (t2Ref.current !== null) clearTimeout(t2Ref.current)
    }
  }, [entered])

  return (
    <>
      <AnimatePresence>
        {!entered && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-[#F4EDE0] text-[#0E0E0C]"
            role="status"
            aria-label="Opening today’s edition"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 60% 40% at 0% 0%, rgba(216, 122, 15, 0.10) 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(200, 50, 30, 0.07) 0%, transparent 60%)',
            }}
          >
            {/* Top dateline */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="absolute left-0 right-0 top-0 flex items-center justify-between border-b border-[rgba(14,14,12,0.20)] px-6 py-3 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3A372F]"
            >
              <span>Opening today’s edition</span>
              <span>
                <span className="num font-bold text-[#0E0E0C]">{Math.round(progress * 100)}</span> / 100
              </span>
            </motion.div>

            {/* Halftone giant wordmark, behind */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 select-none text-center font-display font-bold leading-[0.85]"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 'clamp(8rem, 26vw, 28rem)',
                letterSpacing: 0,
                fontVariationSettings: "'opsz' 144, 'wght' 700",
                color: 'transparent',
                backgroundImage:
                  'radial-gradient(circle, rgba(14,14,12,0.92) 1.1px, transparent 1.5px)',
                backgroundSize: '5px 5px',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                opacity: 0.18,
              }}
            >
              FOODLK
            </div>

            {/* Foreground composition */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Hand-drawn crate that fills with produce dots */}
              <svg viewBox="0 0 220 160" className="h-40 w-56" aria-hidden="true">
                {/* crate */}
                <path
                  d="M20 50 L200 50 L188 145 L32 145 Z"
                  fill="none"
                  stroke="#0E0E0C"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
                <line x1="60" y1="50" x2="56" y2="145" stroke="#0E0E0C" strokeWidth="1.4" opacity="0.55" />
                <line x1="110" y1="50" x2="110" y2="145" stroke="#0E0E0C" strokeWidth="1.4" opacity="0.55" />
                <line x1="160" y1="50" x2="164" y2="145" stroke="#0E0E0C" strokeWidth="1.4" opacity="0.55" />
                <line x1="32" y1="100" x2="188" y2="100" stroke="#0E0E0C" strokeWidth="1.4" opacity="0.35" strokeDasharray="3 4" />

                {/* steam puffs above crate */}
                <motion.g
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 0.7 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <path d="M70 30 C72 24 66 22 70 14" stroke="#3A372F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  <path d="M105 26 C108 19 100 17 105 9" stroke="#3A372F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                  <path d="M140 30 C142 23 135 21 140 14" stroke="#3A372F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </motion.g>

                {/* produce dots — appear in sequence with progress */}
                {[
                  { cx: 50, cy: 130, r: 7, fill: '#C8321E' },     // chili
                  { cx: 78, cy: 122, r: 6, fill: '#E8A317' },     // mango
                  { cx: 105, cy: 132, r: 8, fill: '#2C4A22' },    // leaf
                  { cx: 132, cy: 120, r: 6, fill: '#D77A0F' },    // turmeric
                  { cx: 158, cy: 130, r: 7, fill: '#841C0F' },    // chili dark
                  { cx: 65, cy: 108, r: 5, fill: '#E8A317' },
                  { cx: 95, cy: 112, r: 6, fill: '#3F6431' },
                  { cx: 125, cy: 110, r: 5, fill: '#C8321E' },
                  { cx: 152, cy: 110, r: 5, fill: '#D77A0F' },
                ].map((p, i) => {
                  const threshold = (i + 1) / 10
                  const visible = progress >= threshold
                  return (
                    <motion.circle
                      key={i}
                      cx={p.cx}
                      cy={p.cy}
                      r={p.r}
                      fill={p.fill}
                      initial={{ scale: 0, y: -16, opacity: 0 }}
                      animate={visible ? { scale: 1, y: 0, opacity: 1 } : { scale: 0, y: -16, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                      style={{ transformOrigin: `${p.cx}px ${p.cy}px` }}
                    />
                  )
                })}
              </svg>

              {/* Wordmark */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="mt-6 font-display text-[44px] font-bold leading-none tracking-normal text-[#0E0E0C]"
                style={{ fontVariationSettings: "'opsz' 144, 'wght' 700" }}
              >
                FoodLK<span className="text-[#C8321E]">.</span>
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-2 font-mono text-[10px] uppercase tracking-[0.28em] text-[#6B6657]"
              >
                Sri Lanka’s food price desk · Edition 01
              </motion.p>

              {/* Progress rule */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 h-[2px] w-72 overflow-hidden bg-[rgba(14,14,12,0.12)]"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-[#0E0E0C]"
                  style={{ width: `${progress * 100}%`, transition: 'width 80ms linear' }}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[#3A372F]"
              >
                {progress < 0.4
                  ? 'Setting type…'
                  : progress < 0.8
                  ? 'Inking the plate…'
                  : 'To press.'}
              </motion.p>
            </div>

            {/* Bottom rule + colophon */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[rgba(14,14,12,0.20)] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#6B6657]">
              <span>රු · LKR</span>
              <span>Set in Fraunces &amp; JetBrains Mono</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entered && children}
    </>
  )
}
