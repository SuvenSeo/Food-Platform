import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

function useCountUp(target: number, duration = 1200, start = false) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!start || target === 0) return
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, start])

  return value
}

export interface StatItem {
  label: string
  value: number
  suffix?: string
  prefix?: string
  helper?: string
  highlight?: boolean
}

interface StatsBentoProps {
  stats: StatItem[]
  className?: string
  columns?: 2 | 3 | 4
}

function StatTile({ stat, animate, index }: { stat: StatItem; animate: boolean, index: number }) {
  const count = useCountUp(stat.value, 1400, animate)

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={animate ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col justify-between p-5 relative overflow-hidden',
        stat.highlight && 'bg-[color:var(--color-text-primary)] text-[color:var(--paper-50)]',
      )}
    >
      <p className={cn(
        'font-mono text-[10px] font-bold uppercase tracking-[0.22em]',
        stat.highlight ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-muted)]',
      )}>{stat.label}</p>
      <div className="mt-4">
        <p className={cn(
          'num text-[42px] font-bold tracking-[-0.025em] leading-[0.95]',
          stat.highlight ? 'text-[color:var(--paper-50)]' : 'text-[color:var(--color-text-primary)]',
        )}>
          {stat.prefix}
          {count.toLocaleString()}
          {stat.suffix}
        </p>
        {stat.helper && (
          <p className={cn(
            'mt-2 font-display text-[13px] italic leading-[1.4]',
            stat.highlight ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-secondary)]',
          )} style={{ fontVariationSettings: "'opsz' 24" }}>{stat.helper}</p>
        )}
      </div>
    </motion.div>
  )
}

export function StatsBento({ stats, className, columns = 4 }: StatsBentoProps) {
  const [animate, setAnimate] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimate(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[columns]

  return (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] divide-y sm:divide-y-0 sm:divide-x divide-[color:var(--color-border)]',
        'grid', gridCols,
        className
      )}
    >
      {stats.map((stat, i) => (
        <StatTile key={stat.label} stat={stat} animate={animate} index={i} />
      ))}
    </div>
  )
}
