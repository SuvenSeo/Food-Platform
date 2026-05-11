export type StatsSummary = {
  offers_count: number
  sources_count: number
  categories_count: number
  last_scrape_at: string | null
}

export type HeroSummary = {
  platform: string
  headline: string
  last_updated_at: string | null
}

export type OfferItem = {
  id: number
  source: string
  category: string
  brand: string | null
  display_name: string
  canonical_name: string
  price_lkr: number
  price_per_unit_lkr: number | null
  unit: string | null
  unit_amount: number | null
  available: boolean
  url: string
  price_band: string | null
  delta_vs_median_pct: number | null
}

export type OffersResponse = {
  total: number
  items: OfferItem[]
}

export type TrendItem = {
  cluster_key: string
  canonical_name: string
  brand: string | null
  median_price_lkr: number
  average_price_lkr: number
  offers_count: number
  unit: string | null
  unit_amount: number | null
}

export type PipelineItem = {
  source: string
  status: string
  items_seen: number
  items_stored: number
  started_at: string | null
  finished_at: string | null
  error_message: string | null
}

export type MarketQuoteItem = {
  id: number
  district: string
  market_name: string
  item_name: string
  category: string
  unit: string
  price_lkr: number
  source: string
  quoted_at: string | null
  notes: string | null
}

export type HomeSummary = {
  hero: HeroSummary
  kpis: {
    offers_count: number
    sources_count: number
    categories_count: number
    market_quotes_count: number
  }
  spotlights: {
    cheapest_offers: OfferItem[]
    market_quotes: Array<{
      id: number
      district: string
      market_name: string
      item_name: string
      category: string
      unit: string
      price_lkr: number
      quoted_at: string | null
    }>
  }
}

export type IntelligenceSummary = {
  rankings: {
    top_value: OfferItem[]
    trend_snapshot: TrendItem[]
  }
  sources: PipelineItem[]
}

export type CategorySummaryItem = {
  category: string
  retail_offers_count: number
  market_quotes_count: number
  retail_median_lkr: number | null
  market_average_lkr: number | null
}

export type DistrictCompareItem = {
  item_name: string
  category: string
  left_price_lkr: number
  right_price_lkr: number
  delta_lkr: number
  cheaper_side: 'left' | 'right' | 'equal'
}

export type DistrictCompareSummary = {
  mode: 'district'
  left: string
  right: string
  items: DistrictCompareItem[]
}

export type BasketEstimateResponse = {
  preset: {
    id: string
    label: string
  }
  summary: {
    total_lkr: number
    available_items: number
    missing_items: number
  }
  items: Array<{
    label: string
    kind: string
    price_lkr: number | null
    source: string | null
  }>
}

export type WatchlistEntry = {
  id: string
  title: string
  kind: string
  href: string
  summary: string
}
