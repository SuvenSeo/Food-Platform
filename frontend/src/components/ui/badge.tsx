import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-orange-500/15 text-orange-400 ring-orange-500/25',
        orange: 'bg-orange-500/15 text-orange-400 ring-orange-500/25',
        green: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
        amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
        red: 'bg-red-500/15 text-red-400 ring-red-500/25',
        neutral: 'bg-white/[0.08] text-[#a3a3a3] ring-white/[0.10]',
        outline: 'border border-white/[0.12] bg-transparent text-[#a3a3a3] ring-0',
        teal: 'bg-teal-500/15 text-teal-400 ring-teal-500/25',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
