import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ItemsPage } from './items-page'

vi.mock('../lib/api', () => ({
  api: {
    getItems: vi.fn().mockResolvedValue({
      total: 2,
      items: [
        {
          slug: 'coconut-oil',
          canonical_name: 'coconut oil',
          display_name: 'Cargills Coconut Oil',
          category: 'grocery',
          kind: 'retail',
          unit: 'l',
          unit_amount: 1,
          offers_count: 4,
          lowest_price_lkr: 1650,
          median_price_lkr: 1700,
          image_url: 'https://example.com/coconut.png',
          sources: ['cargills', 'keells'],
          source_count: 2,
          latest_updated_at: '2026-05-19T00:00:00+00:00',
        },
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
          sources: ['doa', 'dcs'],
          source_count: 2,
          latest_updated_at: '2026-05-19T00:00:00+00:00',
        },
      ],
    }),
    getTrendsSummary: vi.fn().mockResolvedValue({
      generated_at: '2026-05-19T00:00:00+00:00',
      items: [],
    }),
  },
}))

function renderItems() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ItemsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ItemsPage', () => {
  it('renders retail and market items with price signals and detail links', async () => {
    renderItems()

    await waitFor(() => {
      expect(screen.getByText('Cargills Coconut Oil')).toBeInTheDocument()
    })

    expect(screen.getByText('Tomato')).toBeInTheDocument()
    expect(screen.getByText(/visible rows/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cargills Coconut Oil/i })).toHaveAttribute('href', '/items/coconut-oil')
    expect(screen.getByRole('link', { name: /Tomato/i })).toHaveAttribute('href', '/items/tomato')
  })

  it('filters visible catalog results by retail or market signal type', async () => {
    renderItems()

    await waitFor(() => {
      expect(screen.getByText('Cargills Coconut Oil')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^market/i }))

    expect(screen.queryByText('Cargills Coconut Oil')).not.toBeInTheDocument()
    expect(screen.getByText('Tomato')).toBeInTheDocument()
    expect(screen.getByText(/visible rows/i).nextElementSibling).toHaveTextContent('1')
  })
})
