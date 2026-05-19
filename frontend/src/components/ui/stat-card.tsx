import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: string
  helper: string
  trend?: number[]
  accent?: boolean
}

export function StatCard({ label, value, helper, trend, accent = false }: StatCardProps) {
  const sparkData = trend?.map((v, i) => ({ v, i }))

  return (
    <motion.article
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'flex flex-col justify-between gap-4 border p-5 transition-colors',
        accent
          ? 'border-[color:var(--color-text-primary)] bg-[color:var(--color-text-primary)] text-[color:var(--paper-50)]'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-bg-card)] text-[color:var(--color-text-primary)]',
      )}
    >
      <div>
        <p className={cn(
          'font-mono text-[10px] font-bold uppercase tracking-[0.22em]',
          accent ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-muted)]',
        )}>{label}</p>
        <p className={cn(
          'num mt-3 text-[36px] font-bold leading-[0.95] tracking-[-0.025em]',
          accent ? 'text-[color:var(--paper-50)]' : 'text-[color:var(--color-text-primary)]',
        )}>
          {value}
        </p>
        <p className={cn(
          'mt-2 font-display text-[13px] italic leading-[1.4]',
          accent ? 'text-[color:var(--paper-300)]' : 'text-[color:var(--color-text-secondary)]',
        )} style={{ fontVariationSettings: "'opsz' 24" }}>{helper}</p>
      </div>

      {sparkData && sparkData.length > 1 && (
        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={accent ? '#E8A317' : '#C8321E'}
                strokeWidth={1.6}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.article>
  )
}
