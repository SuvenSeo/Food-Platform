import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Soup } from 'lucide-react'

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

  useEffect(() => {
    if (entered) return

    const start = performance.now()
    const duration = 1600

    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - start
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)

      if (p < 1) {
        requestAnimationFrame(tick)
      } else {
        setTimeout(() => {
          setExiting(true)
          setTimeout(() => {
            try { sessionStorage.setItem(STORAGE_KEY, '1') } catch {}
            setEntered(true)
          }, 500)
        }, 200)
      }
    })

    return () => cancelAnimationFrame(raf)
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
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black"
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(249,115,22,0.08) 0%, transparent 70%)',
              }}
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
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] ring-1 ring-white/[0.08]"
              >
                <Soup className="h-6 w-6 text-orange-400" />
              </motion.div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 text-center"
            >
              <p
                className="font-display text-2xl text-white/90"
                style={{ fontFamily: '"DM Serif Display", serif', letterSpacing: '-0.03em' }}
              >
                Food Intelligence
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/30">
                Sri Lanka
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 h-px w-48 overflow-hidden rounded-full bg-white/[0.08]"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                style={{ width: `${progress * 100}%` }}
                transition={{ ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {entered && children}
    </>
  )
}
