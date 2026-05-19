import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { BasketPage } from './basket-page'

vi.mock('../hooks/use-watchlists', () => ({
  useWatchlists: () => ({ saveEntry: vi.fn() }),
}))

vi.mock('../lib/api', () => ({
  api: {
    getBasketEstimate: vi.fn().mockResolvedValue({
      preset: { id: 'essentials', label: 'Essentials' },
      available_presets: [{ id: 'essentials', label: 'Essentials' }],
      summary: {
        total_lkr: 1920,
        available_items: 2,
        missing_items: 1,
        totals_by_kind: {
          offer: { count: 1, total_lkr: 1600 },
          market_quote: { count: 1, total_lkr: 320 },
        },
      },
      items: [
        {
          label: 'Coconut oil',
          kind: 'offer',
          price_lkr: 1600,
          source: 'spar2u',
          observed_at: '2026-05-19T00:00:00+00:00',
          freshness_status: 'current',
          freshness_window_days: null,
          availability_status: 'available',
          availability_reason: 'best_match_found',
          alternatives: [],
        },
        {
          label: 'Tomato',
          kind: 'market_quote',
          price_lkr: 320,
          source: 'Pettah',
          observed_at: '2026-05-19T00:00:00+00:00',
          freshness_status: 'current',
          freshness_window_days: 30,
          availability_status: 'available',
          availability_reason: 'best_match_found',
          alternatives: [],
        },
        {
          label: 'Wheat flour',
          kind: 'market_quote',
          price_lkr: null,
          source: null,
          observed_at: null,
          freshness_status: 'unavailable',
          freshness_window_days: 30,
          availability_status: 'missing',
          availability_reason: 'stale_data_hidden',
          alternatives: [],
        },
      ],
    }),
  },
}))

function renderBasket() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BasketPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BasketPage', () => {
  it('explains current quote windows and stale hidden basket lines', async () => {
    renderBasket()

    await waitFor(() => {
      expect(screen.getByText('Wheat flour')).toBeInTheDocument()
    })

    expect(screen.getAllByText(/last 30 days/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/1 basket line had only older market data/i)).toBeInTheDocument()
    expect(screen.getByText(/only older quotes were found/i)).toBeInTheDocument()
  })
})
