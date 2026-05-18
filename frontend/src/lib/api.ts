import type {
  BasketEstimateResponse,
  CategorySummaryItem,
  DistrictCompareSummary,
  HomeSummary,
  IntelligenceBrief,
  IntelligenceSummary,
  MarketQuoteItem,
  OffersResponse,
  PlatformFreshnessSummary,
  PipelineItem,
  PriceTrendResponse,
  StatsSummary,
  TrendItem,
  TrendsSummaryResponse,
} from '../types'

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`
    try {
      const payload = (await response.json()) as { detail?: string }
      if (payload.detail) {
        detail = payload.detail
      }
    } catch {
      // Best-effort error parsing; fallback message is enough.
    }
    throw new ApiError(response.status, detail)
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
  getPlatformFreshness: () => fetchJson<PlatformFreshnessSummary>('/platform/freshness'),
  getIntelligenceBrief: () => fetchJson<IntelligenceBrief>('/intelligence/brief'),
  getOffers: (searchParams = '') => fetchJson<OffersResponse>(`/offers${searchParams}`),
  getOffer: (id: string) => fetchJson<OffersResponse['items'][number]>(`/offers/${id}`),
  getTrends: (category: string) => fetchJson<{ items: TrendItem[] }>(`/trends/${category}`),
  getPipeline: () => fetchJson<{ items: PipelineItem[] }>('/pipeline/status'),
  getMarketQuotes: (searchParams = '') => fetchJson<{ items: MarketQuoteItem[]; total: number }>(`/market-quotes${searchParams}`),
  getMarketPriceTrend: (item: string, district?: string, granularity: 'monthly' | 'yearly' = 'monthly') => {
    const params = new URLSearchParams({ item, granularity })
    if (district) params.set('district', district)
    return fetchJson<PriceTrendResponse>(`/trends/market?${params.toString()}`)
  },
  getTrendsSummary: () => fetchJson<TrendsSummaryResponse>('/trends/summary'),
  getPriceChanges: (limit = 50) => fetchJson<PriceChangesResponse>(`/changes?limit=${limit}`),
}

export type PriceChangeItem = {
  kind: 'retail_offer' | 'market_quote'
  source: string
  label: string
  category?: string
  price_lkr: number
  observed_at: string | null
  direction: string
  delta_vs_median_pct?: number
  delta_lkr?: number
  delta_pct?: number | null
  district?: string
}

export type PriceChangesResponse = {
  items: PriceChangeItem[]
  counts: { retail: number; market: number; total: number }
}

export type AlertSubscribeResult = {
  ok: boolean
  preview_mode: boolean
  email_sent: boolean
  message: string
}

export async function subscribeAlert(body: {
  email: string
  scope: string
  scope_value?: string | null
  cadence?: string
}): Promise<AlertSubscribeResult> {
  const response = await fetch(`${API_BASE}/alerts/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as AlertSubscribeResult & { detail?: string }
  if (!response.ok) {
    throw new ApiError(response.status, payload.detail || 'Subscription failed')
  }
  return payload
}
