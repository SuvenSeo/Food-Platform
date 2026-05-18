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
        'rounded-shell border shadow-soft',
        paddingMap[padding],
        variant === 'default' && 'border-border bg-surface text-foreground',
        variant === 'accent' &&
          'border-brand-500/20 bg-gradient-to-br from-brand-500/[0.07] to-transparent',
        variant === 'ghost' && 'border-transparent bg-surface-elevated/60',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
