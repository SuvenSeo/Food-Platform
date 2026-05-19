import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 transition-all',
  {
    variants: {
      variant: {
        default: 'bg-[color:var(--color-accent-dim)] text-[color:var(--chili-600)] ring-[color:var(--color-accent-glow)]',
        orange: 'bg-[color:var(--color-accent-dim)] text-[color:var(--chili-600)] ring-[color:var(--color-accent-glow)]',
        green: 'bg-[rgba(44,74,34,0.14)] text-[color:var(--curry-leaf)] ring-[rgba(44,74,34,0.28)]',
        amber: 'bg-[rgba(232,163,23,0.18)] text-[color:var(--turmeric-deep)] ring-[rgba(232,163,23,0.34)]',
        red: 'bg-[rgba(200,50,30,0.14)] text-[color:var(--chili-600)] ring-[rgba(200,50,30,0.32)]',
        neutral: 'bg-[rgba(14,14,12,0.06)] text-[color:var(--color-text-secondary)] ring-[color:var(--color-border)]',
        outline: 'border border-[color:var(--color-border-hover)] bg-transparent text-[color:var(--color-text-secondary)] ring-0',
        teal: 'bg-[rgba(44,74,34,0.12)] text-[color:var(--curry-leaf)] ring-[rgba(44,74,34,0.25)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)
