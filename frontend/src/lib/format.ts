import type { PriceTrendPoint } from '../types'

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) {
    return 'N/A'
  }
  return new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function mapTrendSeriesToChart(series: PriceTrendPoint[]) {
  return series
    .filter((point) => point.avg_price != null)
    .map((point) => ({
      period: point.period,
      price: point.avg_price as number,
      min: point.min_price,
      max: point.max_price,
      dataPoints: point.data_points,
    }))
}

export function formatCompactDate(value: string | null | undefined): string {
  if (!value) {
    return 'No recent run'
  }
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
