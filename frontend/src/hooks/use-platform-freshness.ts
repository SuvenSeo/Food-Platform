import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'

export function usePlatformFreshness() {
  return useQuery({
    queryKey: ['platform-freshness'],
    queryFn: api.getPlatformFreshness,
    staleTime: 60_000,
    refetchInterval: 180_000,
  })
}
