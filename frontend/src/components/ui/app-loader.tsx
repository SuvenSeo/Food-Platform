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
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black"
            role="status"
            aria-label="Loading FoodLK platform"
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249,115,22,0.08) 0%, transparent 70%)',
              }}
              aria-hidden="true"
            />

            {/* Logo ring */}
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                className="absolute h-20 w-20 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: '#f97316',
                  borderRightColor: 'rgba(249,115,22,0.3)',
                }}
                aria-hidden="true"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] ring-1 ring-white/[0.08]"
              >
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-400" aria-hidden="true">
                  <path d="M6 17a10 10 0 0 0 20 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <line x1="4" y1="17" x2="28" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55"/>
                  <path d="M16 6 C13 9 11 11 12 15 C13 17.5 19 17.5 20 14 C21.5 10 19 7 16 6Z" fill="currentColor"/>
                </svg>
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              className="mt-8 text-center"
            >
              <p
                className="text-3xl font-bold text-white/90 tracking-tight"
                style={{ fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.04em' }}
              >
                FoodLK
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/30" aria-hidden="true">
                Sri Lanka Price Intelligence
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 h-px w-48 overflow-hidden rounded-full bg-white/[0.08]"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                style={{ width: `${progress * 100}%`, transition: 'width 80ms linear' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {entered && children}
    </>
  )
}
