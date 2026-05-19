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
  image_url: string | null
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
  mode: 'district' | 'source'
  left: string
  right: string
  items: DistrictCompareItem[]
}

export type BasketEstimateResponse = {
  preset: {
    id: string
    label: string
  }
  available_presets: Array<{
    id: string
    label: string
  }>
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

export type PlatformFreshnessSummary = {
  generated_at: string | null
  freshness: {
    last_scrape_at: string | null
    last_offer_seen_at: string | null
    last_market_quote_at: string | null
    scrape_latency_minutes: number | null
  }
  coverage: {
    offers_count: number
    market_quotes_count: number
    sources_count: number
    categories_count: number
  }
  pipeline: {
    healthy_sources: number
    total_sources: number
    latest_status: string | null
    source_health_ratio: number | null
  }
  confidence: {
    score: number
    grade: 'high' | 'medium' | 'low'
    note: string
  }
}

export type PriceTrendPoint = {
  period: string
  avg_price: number | null
  min_price: number | null
  max_price: number | null
  data_points: number
}

export type PriceTrendResponse = {
  item: string
  district: string | null
  granularity: string
  series: PriceTrendPoint[]
  total_data_points: number
  date_range: { from: string | null; to: string | null }
}

export type TrendSummaryItem = {
  item_name: string
  data_points: number
  earliest: string | null
  latest: string | null
  avg_price_lkr: number | null
}

export type TrendsSummaryResponse = {
  total_market_data_points: number
  top_items: TrendSummaryItem[]
  sources: Array<{ source: string; data_points: number; earliest: string | null; latest: string | null }>
}

export type IntelligenceBrief = {
  generated_at: string | null
  trust: PlatformFreshnessSummary
  brief: {
    urgency: 'routine' | 'watch' | 'action-needed'
    headline: string
    highlights: Array<{
      label: string
      value: string
    }>
    recommendations: string[]
  }
  top_value_offer: OfferItem | null
  latest_market_signal: {
    district: string
    market_name: string
    item_name: string
    price_lkr: number
    quoted_at: string | null
  } | null
}
