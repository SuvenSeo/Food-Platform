import type {
  HomeSummary,
  IntelligenceSummary,
  MarketQuoteItem,
  OffersResponse,
  PipelineItem,
  StatsSummary,
  TrendItem,
} from '../types'

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export const api = {
  getHomeSummary: () => fetchJson<HomeSummary>('/home/summary'),
  getIntelligenceSummary: () => fetchJson<IntelligenceSummary>('/intelligence/summary'),
  getStats: () => fetchJson<StatsSummary>('/stats/summary'),
  getOffers: (searchParams = '') => fetchJson<OffersResponse>(`/offers${searchParams}`),
  getOffer: (id: string) => fetchJson<OffersResponse['items'][number]>(`/offers/${id}`),
  getTrends: (category: string) => fetchJson<{ items: TrendItem[] }>(`/trends/${category}`),
  getPipeline: () => fetchJson<{ items: PipelineItem[] }>('/pipeline/status'),
  getMarketQuotes: (searchParams = '') => fetchJson<{ items: MarketQuoteItem[]; total: number }>(`/market-quotes${searchParams}`),
}
