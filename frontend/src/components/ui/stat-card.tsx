import { ResponsiveContainer, LineChart, Line } from 'recharts'
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
    <article
      className={cn(
        'fp-kpi flex flex-col justify-between gap-4 transition-all',
        accent && 'border-orange-500/20 bg-orange-500/[0.04]'
      )}
    >
      <div>
        <p className="eyebrow-label">{label}</p>
        <p className={cn('num mt-3 text-3xl font-semibold tracking-tight', accent ? 'text-orange-400' : 'text-[#f5f5f5]')}>
          {value}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#737373]">{helper}</p>
      </div>

      {sparkData && sparkData.length > 1 && (
        <div className="h-10 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={accent ? '#f97316' : '#4a4a4a'}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  )
}
