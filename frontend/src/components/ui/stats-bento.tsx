import { useEffect, useRef, useState } from 'react'
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

function StatTile({ stat, animate }: { stat: StatItem; animate: boolean }) {
  const count = useCountUp(stat.value, 1400, animate)

  return (
    <div
      className={cn(
        'flex flex-col justify-between p-5',
        stat.highlight && 'bg-[#181818]'
      )}
    >
      <p className="eyebrow-label">{stat.label}</p>
      <div className="mt-4">
        <p className="num text-3xl font-semibold tracking-tight text-[#f5f5f5]">
          {stat.prefix}
          {count.toLocaleString()}
          {stat.suffix}
        </p>
        {stat.helper && (
          <p className="mt-1.5 text-xs leading-5 text-[#737373]">{stat.helper}</p>
        )}
      </div>
    </div>
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
        'hairline-grid rounded-panel overflow-hidden',
        gridCols,
        className
      )}
    >
      {stats.map((stat) => (
        <StatTile key={stat.label} stat={stat} animate={animate} />
      ))}
    </div>
  )
}
