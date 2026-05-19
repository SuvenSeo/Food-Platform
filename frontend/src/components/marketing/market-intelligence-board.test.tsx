import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { MarketIntelligenceBoard } from './market-intelligence-board'
import type { HomeSummary, IntelligenceSummary, OfferItem, PlatformFreshnessSummary } from '../../types'

const offer: OfferItem = {
  id: 42,
  source: 'keells',
  category: 'vegetables',
  brand: 'Keells',
  display_name: 'Carrot 1kg',
  canonical_name: 'carrot',
  price_lkr: 480,
  price_per_unit_lkr: 480,
  unit: 'kg',
  unit_amount: 1,
  original_title: 'Carrot',
  original_variant_title: null,
  original_unit_text: '1kg',
  normalized_unit: 'kg',
  normalized_unit_amount: 1,
  normalized_unit_price_lkr: 480,
  normalization_confidence: 0.92,
  available: true,
  url: 'https://example.com/carrot',
  image_url: null,
  first_seen_at: '2026-05-18T07:00:00+05:30',
  last_seen_at: '2026-05-19T07:00:00+05:30',
  price_band: 'good-value',
  delta_vs_median_pct: 8,
}

const home: HomeSummary = {
  hero: {
    platform: 'Mandiya',
    headline: 'Food intelligence',
    last_updated_at: '2026-05-19T07:30:00+05:30',
  },
  kpis: {
    offers_count: 240,
    sources_count: 8,
    categories_count: 12,
    market_quotes_count: 96,
  },
  spotlights: {
    cheapest_offers: [offer],
    market_quotes: [
      {
        id: 7,
        district: 'Colombo',
        market_name: 'Pettah',
        item_name: 'Tomato',
        category: 'vegetables',
        unit: 'kg',
        price_lkr: 360,
        quoted_at: '2026-05-19T06:30:00+05:30',
      },
    ],
  },
}

const intelligence: IntelligenceSummary = {
  rankings: {
    top_value: [offer],
    trend_snapshot: [
      {
        cluster_key: 'carrot',
        canonical_name: 'Carrot',
        brand: null,
        median_price_lkr: 500,
        average_price_lkr: 515,
        offers_count: 12,
        unit: 'kg',
        unit_amount: 1,
      },
    ],
  },
  sources: [],
}

const freshness: PlatformFreshnessSummary = {
  generated_at: '2026-05-19T08:00:00+05:30',
  freshness: {
    last_scrape_at: '2026-05-19T07:45:00+05:30',
    last_offer_seen_at: '2026-05-19T07:45:00+05:30',
    last_market_quote_at: '2026-05-19T07:30:00+05:30',
    scrape_latency_minutes: 15,
  },
  coverage: {
    offers_count: 240,
    market_quotes_count: 96,
    sources_count: 8,
    categories_count: 12,
  },
  pipeline: {
    healthy_sources: 8,
    degraded_sources: 0,
    total_sources: 8,
    latest_status: 'success',
    source_health_ratio: 1,
    blocking_warnings: [],
  },
  confidence: {
    score: 0.95,
    grade: 'high',
    note: 'All feeds fresh.',
  },
}

describe('MarketIntelligenceBoard', () => {
  it('renders live price intelligence and primary workflows', () => {
    render(
      <MemoryRouter>
        <MarketIntelligenceBoard home={home} intelligence={intelligence} freshness={freshness} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/live market board/i)).toBeInTheDocument()
    expect(screen.getByText(/trust first/i)).toBeInTheDocument()
    expect(screen.getByText(/carrot 1kg/i)).toBeInTheDocument()
    expect(screen.getByText(/tomato · colombo/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open offer/i })).toHaveAttribute('href', '/offers/42')
    expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '/compare')
  })
})
