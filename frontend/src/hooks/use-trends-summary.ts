import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'

export function useTrendsSummary() {
  return useQuery({
    queryKey: ['trends-summary'],
    queryFn: api.getTrendsSummary,
  })
}
