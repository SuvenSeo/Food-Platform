import React, { useEffect, useRef, type ReactNode, type ElementType } from 'react'
import { cn } from '../../lib/utils'

interface RevealSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  threshold?: number
  as?: ElementType
}

export function RevealSection({
  children,
  className,
  delay = 0,
  threshold = 0.12,
  as: Tag = 'div',
}: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null)

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

  const TagComp = Tag as 'div'
  return (
    <TagComp ref={ref as React.RefObject<HTMLDivElement>} className={cn('reveal', className)}>
      {children}
    </TagComp>
  )
}
