import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from '../App'

const jsonResponse = (data: unknown) =>
  Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response)

function renderApp(initialEntries: string[] = ['/']) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('dashboard app', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)

      if (url.includes('/home/summary')) {
        return jsonResponse({
          hero: {
            platform: 'Sri Lanka Food Intelligence',
            headline: 'Track how food prices move across retail shelves and public markets.',
            last_updated_at: '2026-05-11T15:00:00Z',
          },
          kpis: {
            offers_count: 1280,
            sources_count: 2,
            categories_count: 12,
            market_quotes_count: 6,
          },
          spotlights: {
            cheapest_offers: [
              {
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
                url: 'https://spar2u.lk/products/spar-local-coconut-oil-1l',
                price_band: 'good-value',
                delta_vs_median_pct: 5.88,
              },
            ],
            market_quotes: [
              {
                id: 1,
                district: 'Colombo',
                market_name: 'Pettah',
                item_name: 'Tomato',
                category: 'vegetables',
                unit: 'kg',
                price_lkr: 320,
                quoted_at: '2026-05-11T15:00:00Z',
              },
            ],
          },
        })
      }

      if (url.includes('/intelligence/summary')) {
        return jsonResponse({
          rankings: {
            top_value: [
              {
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
                url: 'https://spar2u.lk/products/spar-local-coconut-oil-1l',
                price_band: 'good-value',
                delta_vs_median_pct: 5.88,
              },
            ],
          },
          sources: [
            {
              source: 'spar2u',
              status: 'completed',
              items_seen: 220,
              items_stored: 220,
              started_at: '2026-05-11T14:50:00Z',
              finished_at: '2026-05-11T15:00:00Z',
              error_message: null,
            },
          ],
        })
      }

      if (url.includes('/stats/summary')) {
        return jsonResponse({
          offers_count: 1280,
          sources_count: 2,
          categories_count: 12,
          last_scrape_at: '2026-05-11T15:00:00Z',
        })
      }

      if (url.includes('/offers')) {
        return jsonResponse({
          total: 1,
          items: [
            {
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
              url: 'https://spar2u.lk/products/spar-local-coconut-oil-1l',
              price_band: 'good-value',
              delta_vs_median_pct: 5.88,
            },
          ],
        })
      }

      if (url.includes('/pipeline/status')) {
        return jsonResponse({
          items: [
            {
              source: 'spar2u',
              status: 'completed',
              items_seen: 220,
              items_stored: 220,
              started_at: '2026-05-11T14:50:00Z',
              finished_at: '2026-05-11T15:00:00Z',
              error_message: null,
            },
          ],
        })
      }

      if (url.includes('/trends/grocery')) {
        return jsonResponse({
          items: [
            {
              cluster_key: 'spar|local coconut oil|l|1.000',
              canonical_name: 'local coconut oil',
              brand: 'SPAR',
              median_price_lkr: 1650,
              average_price_lkr: 1650,
              offers_count: 2,
              unit: 'l',
              unit_amount: 1,
            },
          ],
        })
      }

      if (url.includes('/market-quotes')) {
        return jsonResponse({
          total: 2,
          items: [
            {
              id: 1,
              district: 'Colombo',
              market_name: 'Pettah',
              item_name: 'Tomato',
              category: 'vegetables',
              unit: 'kg',
              price_lkr: 320,
              source: 'seed',
              quoted_at: '2026-05-11T15:00:00Z',
              notes: null,
            },
            {
              id: 2,
              district: 'Kandy',
              market_name: 'Kandy Central',
              item_name: 'Tomato',
              category: 'vegetables',
              unit: 'kg',
              price_lkr: 340,
              source: 'seed',
              quoted_at: '2026-05-11T15:00:00Z',
              notes: null,
            },
          ],
        })
      }

      return Promise.reject(new Error(`Unhandled fetch for ${url}`))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the expanded premium navigation', async () => {
    renderApp(['/'])

    expect(await screen.findByRole('link', { name: /intelligence/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /markets/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /basket/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /methods/i })).toBeInTheDocument()
  })

  it('renders the premium homepage hero and spotlights', async () => {
    renderApp(['/'])

    expect(await screen.findByText(/sri lanka food intelligence/i)).toBeInTheDocument()
    expect(await screen.findByText(/track how food prices move across retail shelves and public markets/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /explore intelligence/i })).toBeInTheDocument()
    expect(await screen.findAllByText(/what moved today/i)).toHaveLength(2)
    expect(await screen.findByText(/basket snapshot/i)).toBeInTheDocument()
    expect(await screen.findAllByText(/spar local coconut oil/i)).toHaveLength(2)
  })

  it('renders the methods page', async () => {
    renderApp(['/methods'])

    expect(await screen.findByRole('heading', { name: /methods/i })).toBeInTheDocument()
    expect(screen.getByText(/normalization/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /fair-price logic/i })).toBeInTheDocument()
  })

  it('renders the markets page with wet-market data', async () => {
    renderApp(['/markets'])

    expect(await screen.findByRole('heading', { name: /markets/i })).toBeInTheDocument()
    expect(await screen.findByText(/pettah/i)).toBeInTheDocument()
    expect(await screen.findAllByText(/^tomato$/i)).toHaveLength(2)
  })
})
