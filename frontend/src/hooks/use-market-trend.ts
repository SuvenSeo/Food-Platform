import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'

export type MarketTrendGranularity = 'monthly' | 'yearly'

export function useMarketTrend(
  item: string | undefined,
  options?: {
    district?: string
    granularity?: MarketTrendGranularity
    enabled?: boolean
  },
) {
  const district = options?.district
  const granularity = options?.granularity ?? 'monthly'
  const enabled = options?.enabled ?? true

  return useQuery({
    queryKey: ['market-trend', item, district ?? '', granularity],
    queryFn: () => api.getMarketPriceTrend(item!, district, granularity),
    enabled: enabled && Boolean(item?.trim()),
  })
}
