import type {
  BasketEstimateResponse,
  CategorySummaryItem,
  DistrictCompareSummary,
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
  getCategoriesSummary: () => fetchJson<{ items: CategorySummaryItem[] }>('/categories/summary'),
  getDistrictCompare: (left: string, right: string) =>
    fetchJson<DistrictCompareSummary>(`/compare/districts?left=${encodeURIComponent(left)}&right=${encodeURIComponent(right)}`),
  getBasketEstimate: (preset = 'essentials') =>
    fetchJson<BasketEstimateResponse>(`/basket/estimate?preset=${encodeURIComponent(preset)}`),
  getStats: () => fetchJson<StatsSummary>('/stats/summary'),
  getOffers: (searchParams = '') => fetchJson<OffersResponse>(`/offers${searchParams}`),
  getOffer: (id: string) => fetchJson<OffersResponse['items'][number]>(`/offers/${id}`),
  getTrends: (category: string) => fetchJson<{ items: TrendItem[] }>(`/trends/${category}`),
  getPipeline: () => fetchJson<{ items: PipelineItem[] }>('/pipeline/status'),
  getMarketQuotes: (searchParams = '') => fetchJson<{ items: MarketQuoteItem[]; total: number }>(`/market-quotes${searchParams}`),
}
