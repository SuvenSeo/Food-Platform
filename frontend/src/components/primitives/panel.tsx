import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '../../lib/utils'

type PanelProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  variant?: 'default' | 'accent' | 'ghost'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Panel({
  children,
  className,
  variant = 'default',
  padding = 'md',
  ...props
}: PanelProps) {
  return (
    <section
      className={cn(
        'relative border shadow-paper',
        paddingMap[padding],
        variant === 'default' && 'border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] text-[color:var(--color-text-primary)]',
        variant === 'accent' && 'border-[color:var(--color-text-primary)] bg-[color:var(--paper-50)] text-[color:var(--color-text-primary)]',
        variant === 'ghost' && 'border-[color:var(--color-border)] bg-[color:var(--color-bg-secondary)]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
