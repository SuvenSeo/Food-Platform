import { describe, expect, it } from 'vitest'

import { formatPackSize, normalizedPriceDisplay } from './unit-display'

describe('unit display helpers', () => {
  it('renders small weight packs as pack size and per 100 g comparisons', () => {
    expect(formatPackSize('kg', 0.08)).toBe('80 g pack')
    expect(normalizedPriceDisplay({ pricePerUnitLkr: 900, unit: 'kg', unitAmount: 0.08 })).toEqual({
      price: 90,
      unit: '100 g',
    })
  })

  it('renders small liquid packs as pack size and per 100 ml comparisons', () => {
    expect(formatPackSize('l', 0.18)).toBe('180 ml pack')
    expect(normalizedPriceDisplay({ pricePerUnitLkr: 1000, unit: 'l', unitAmount: 0.18 })).toEqual({
      price: 100,
      unit: '100 ml',
    })
  })
})
