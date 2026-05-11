import { useQuery } from '@tanstack/react-query'

import { api } from '../lib/api'

export function useIntelligenceSummary() {
  return useQuery({
    queryKey: ['intelligence-summary'],
    queryFn: api.getIntelligenceSummary,
  })
}
