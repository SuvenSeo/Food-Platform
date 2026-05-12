import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'

export function useIntelligenceBrief() {
  return useQuery({
    queryKey: ['intelligence-brief'],
    queryFn: api.getIntelligenceBrief,
    staleTime: 60_000,
    refetchInterval: 180_000,
  })
}
