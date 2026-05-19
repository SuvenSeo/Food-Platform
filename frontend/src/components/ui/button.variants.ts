import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-pill text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#f97316] text-black hover:bg-[#fb923c] relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-500',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline:
          'border border-white/[0.12] bg-transparent text-foreground hover:border-white/[0.20] hover:bg-white/[0.06]',
        secondary: 'bg-surface-elevated text-foreground border border-border/50 hover:bg-[#1f1f1f]',
        ghost: 'text-secondary-foreground hover:bg-white/[0.06] hover:text-foreground',
        link: 'text-[#f97316] underline-offset-4 hover:underline p-0 h-auto',
        muted: 'bg-white/[0.06] text-secondary-foreground hover:bg-white/[0.10] hover:text-foreground',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-pill px-4 text-xs',
        lg: 'h-12 rounded-pill px-7 text-base',
        icon: 'h-9 w-9 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
