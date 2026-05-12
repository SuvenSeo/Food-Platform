import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface RevealSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
}

export function RevealSection({
  children,
  className,
  delay = 0,
  threshold = 0.12,
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (delay) {
      el.style.transitionDelay = `${delay}ms`
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return (
    <div ref={ref} className={cn('reveal', className)}>
      {children}
    </div>
  )
}
