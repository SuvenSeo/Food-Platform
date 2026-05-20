export type UnitDisplayInput = {
  pricePerUnitLkr?: number | null
  unit?: string | null
  unitAmount?: number | null
}

function compactNumber(value: number) {
  if (Number.isInteger(value)) return value.toLocaleString('en-LK')
  return value.toLocaleString('en-LK', { maximumFractionDigits: 1 })
}

export function formatPackSize(unit?: string | null, amount?: number | null) {
  if (!unit || amount == null || amount <= 0) return null

  const normalized = unit.toLowerCase()
  if (normalized === 'kg' && amount < 1) return `${compactNumber(amount * 1000)} g pack`
  if (normalized === 'l' && amount < 1) return `${compactNumber(amount * 1000)} ml pack`
  if (normalized === 'piece') return `${compactNumber(amount)} piece${amount === 1 ? '' : 's'}`
  if (normalized === 'unit') return `${compactNumber(amount)} unit${amount === 1 ? '' : 's'}`

  return `${compactNumber(amount)} ${normalized}`
}

export function normalizedPriceDisplay({ pricePerUnitLkr, unit, unitAmount }: UnitDisplayInput) {
  if (!pricePerUnitLkr || !unit) return null

  const normalized = unit.toLowerCase()
  if (normalized === 'kg' && unitAmount != null && unitAmount > 0 && unitAmount < 0.25) {
    return { price: pricePerUnitLkr / 10, unit: '100 g' }
  }
  if (normalized === 'l' && unitAmount != null && unitAmount > 0 && unitAmount < 0.25) {
    return { price: pricePerUnitLkr / 10, unit: '100 ml' }
  }

  return { price: pricePerUnitLkr, unit: normalized }
}
