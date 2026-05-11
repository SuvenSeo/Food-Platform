export function formatCurrency(value: number | null | undefined): string {
  if (value == null) {
    return 'N/A'
  }
  return new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 0,
  }).format(value)
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
