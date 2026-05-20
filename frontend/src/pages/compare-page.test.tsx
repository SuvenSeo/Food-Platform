import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ComparePage } from './compare-page'

vi.mock('../hooks/use-watchlists', () => ({
  useWatchlists: () => ({ saveEntry: vi.fn() }),
}))

vi.mock('../lib/api', () => ({
  api: {
    getItems: vi.fn().mockResolvedValue({
      total: 1,
      items: [
        {
          slug: 'tomato',
          canonical_name: 'Tomato',
          display_name: 'Tomato',
          category: 'vegetables',
          kind: 'market',
          unit: 'kg',
          unit_amount: 1,
          market_quotes_count: 24,
          average_market_price_lkr: 320,
          lowest_price_lkr: 300,
          image_url: null,
          sources: ['seed-colombo', 'seed-kandy'],
          source_count: 2,
          latest_updated_at: '2026-05-19T00:00:00+00:00',
        },
      ],
    }),
    getMarketQuotes: vi.fn().mockResolvedValue({
      total: 2,
      facets: {
        sources: ['seed-colombo', 'seed-kandy'],
        districts: ['Colombo', 'Kandy'],
        categories: ['vegetables'],
        units: ['kg'],
      },
      items: [
        {
          district: 'Colombo',
          market_name: 'Pettah',
          item_name: 'Tomato',
          category: 'vegetables',
          unit: 'kg',
          price_lkr: 320,
          source: 'seed-colombo',
          quoted_at: '2026-05-19T00:00:00+00:00',
        },
        {
          district: 'Kandy',
          market_name: 'Kandy Central',
          item_name: 'Tomato',
          category: 'vegetables',
          unit: 'kg',
          price_lkr: 340,
          source: 'seed-kandy',
          quoted_at: '2026-05-19T00:00:00+00:00',
        },
      ],
    }),
    getDistrictCompare: vi.fn().mockResolvedValue({
      mode: 'district',
      left: 'Colombo',
      right: 'Kandy',
      freshness: {
        market_quote_window_days: 30,
        filtered_categories: ['fuel', 'non-food'],
      },
      items: [
        {
          item_name: 'Tomato',
          category: 'vegetables',
          left_price_lkr: 320,
          right_price_lkr: 340,
          left_quoted_at: '2026-05-19T00:00:00+00:00',
          right_quoted_at: '2026-05-19T00:00:00+00:00',
          delta_lkr: 20,
          cheaper_side: 'left',
        },
      ],
    }),
    getSourceCompare: vi.fn().mockResolvedValue({
      mode: 'source',
      left: 'seed-colombo',
      right: 'seed-kandy',
      items: [],
    }),
  },
}))

function renderCompare() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ComparePage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ComparePage', () => {
  it('shows freshness guidance and labels cheaper side by selected district', async () => {
    renderCompare()

    await waitFor(() => {
      expect(screen.getAllByText('Tomato').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText(/last 30 days/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/older archive rows and fuel, non-food rows are hidden/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Colombo cheaper/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/left cheaper/i)).not.toBeInTheDocument()
  })
})
