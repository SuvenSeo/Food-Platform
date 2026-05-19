import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { RetailPage } from './retail-page'

vi.mock('../lib/api', () => ({
  api: {
    getOffers: vi.fn().mockResolvedValue({
      total: 665,
      facets: {
        sources: [
          { value: 'cargills', label: 'Cargills', count: 60 },
          { value: 'glomark', label: 'Glomark', count: 34 },
          { value: 'keells', label: 'Keells', count: 58 },
          { value: 'spar2u', label: 'Spar2U', count: 513 },
        ],
        categories: [{ value: 'grocery', label: 'grocery', count: 665 }],
        units: [{ value: 'kg', label: 'kg', count: 410 }],
      },
      items: [
        {
          id: 42,
          source: 'cargills',
          category: 'grocery',
          brand: 'Cargills',
          display_name: 'Cargills Coconut Oil',
          canonical_name: 'coconut oil',
          price_lkr: 1650,
          price_per_unit_lkr: 1650,
          unit: 'l',
          unit_amount: 1,
          original_title: 'Cargills Coconut Oil 1L',
          original_variant_title: null,
          original_unit_text: '1L',
          normalized_unit: 'l',
          normalized_unit_amount: 1,
          normalized_unit_price_lkr: 1650,
          normalization_confidence: 0.9,
          available: true,
          url: 'https://example.com/coconut-oil',
          image_url: null,
          first_seen_at: '2026-05-18T00:00:00+00:00',
          last_seen_at: '2026-05-19T00:00:00+00:00',
          price_band: 'fair',
          delta_vs_median_pct: 0,
        },
      ],
    }),
  },
}))

function renderRetail() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RetailPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('RetailPage', () => {
  it('renders source filters from catalog facets instead of only visible offers', async () => {
    renderRetail()

    await waitFor(() => {
      expect(screen.getByText('Cargills Coconut Oil')).toBeInTheDocument()
    })

    expect(screen.getByRole('option', { name: 'Glomark (34)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Keells (58)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Spar2U (513)' })).toBeInTheDocument()
    expect(screen.getByText(/Showing 1 of 665 scraped retail offers/i)).toBeInTheDocument()
  })
})
