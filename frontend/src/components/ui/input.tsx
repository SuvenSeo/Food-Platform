import * as React from 'react'
import { cn } from '../../lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-white/[0.10] bg-surface-elevated px-4 py-2 text-sm text-foreground',
          'placeholder:text-muted-foreground font-ui',
          'focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'transition-all duration-150',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
