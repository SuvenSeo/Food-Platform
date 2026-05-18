import { cn } from '../../lib/utils'

type SparklineProps = {
  values: number[]
  className?: string
  strokeClassName?: string
  height?: number
  width?: number
}

export function Sparkline({
  values,
  className,
  strokeClassName = 'stroke-brand-500',
  height = 32,
  width = 96,
}: SparklineProps) {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        className={cn(strokeClassName, 'stroke-[1.5]')}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
