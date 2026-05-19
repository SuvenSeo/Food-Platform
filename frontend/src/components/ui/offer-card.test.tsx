import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { OfferCard } from './offer-card'
import type { OfferItem } from '../../types'

const baseOffer: OfferItem = {
  id: 1,
  source: 'spar2u',
  category: 'grocery',
  brand: 'SPAR',
  display_name: 'SPAR Local Coconut Oil',
  canonical_name: 'local coconut oil',
  price_lkr: 1600,
  price_per_unit_lkr: 1600,
  unit: 'l',
  unit_amount: 1,
  available: true,
  url: 'https://example.com',
  image_url: null,
  first_seen_at: '2026-05-18T00:00:00+05:30',
  price_band: 'good-value',
  delta_vs_median_pct: 5.88,
  original_title: null,
  original_variant_title: null,
  original_unit_text: 'WT / 1000',
  normalized_unit: 'l',
  normalized_unit_amount: 1,
  normalized_unit_price_lkr: 1600,
  normalization_confidence: 0.95,
  last_seen_at: '2026-05-19T00:00:00+05:30',
}

describe('OfferCard delta semantics', () => {
  it('labels positive fair-price delta as better value', () => {
    render(
      <MemoryRouter>
        <OfferCard offer={baseOffer} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/5.9 percent cheaper than median/i)).toBeInTheDocument()
    expect(screen.getByText(/fresh/i)).toBeInTheDocument()
  })
})
