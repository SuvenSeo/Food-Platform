import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      const requestUrl = new URL(url, 'http://localhost')
      const pathname = requestUrl.pathname

      if (pathname.includes('/home/summary')) {
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

      if (pathname.includes('/intelligence/summary')) {
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

      if (pathname.includes('/stats/summary')) {
        return jsonResponse({
          offers_count: 1280,
          sources_count: 2,
          categories_count: 12,
          last_scrape_at: '2026-05-11T15:00:00Z',
        })
      }

      if (pathname.endsWith('/offers/1')) {
        return jsonResponse({
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
        })
      }

      if (pathname.includes('/offers')) {
        return jsonResponse({
          total: 2,
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
            {
              id: 2,
              source: 'glomark',
              category: 'grocery',
              brand: 'Glomark',
              display_name: 'Glomark Local Coconut Oil',
              canonical_name: 'local coconut oil',
              price_lkr: 1680,
              price_per_unit_lkr: 1680,
              unit: 'l',
              unit_amount: 1,
              available: true,
              url: 'https://glomark.lk/products/local-coconut-oil-1l',
              price_band: 'fair',
              delta_vs_median_pct: 1.82,
            },
          ],
        })
      }

      if (pathname.includes('/pipeline/status')) {
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
            {
              source: 'glomark',
              status: 'completed',
              items_seen: 180,
              items_stored: 176,
              started_at: '2026-05-11T14:40:00Z',
              finished_at: '2026-05-11T14:58:00Z',
              error_message: null,
            },
          ],
        })
      }

      if (pathname.includes('/trends/grocery')) {
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

      if (pathname.includes('/market-quotes')) {
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

      if (pathname.includes('/categories/summary')) {
        return jsonResponse({
          items: [
            {
              category: 'grocery',
              retail_offers_count: 1,
              market_quotes_count: 0,
              retail_median_lkr: 1650,
              market_average_lkr: null,
            },
            {
              category: 'vegetables',
              retail_offers_count: 0,
              market_quotes_count: 2,
              retail_median_lkr: null,
              market_average_lkr: 330,
            },
          ],
        })
      }

      if (pathname.includes('/compare/districts')) {
        const left = requestUrl.searchParams.get('left') || 'Colombo'
        const right = requestUrl.searchParams.get('right') || 'Kandy'
        return jsonResponse({
          mode: 'district',
          left,
          right,
          items: [
            {
              item_name: 'Tomato',
              category: 'vegetables',
              left_price_lkr: 320,
              right_price_lkr: 340,
              delta_lkr: 20,
              cheaper_side: 'left',
            },
          ],
        })
      }

      if (pathname.includes('/basket/estimate')) {
        const preset = requestUrl.searchParams.get('preset') || 'essentials'
        if (preset === 'smart-saver') {
          return jsonResponse({
            preset: {
              id: 'smart-saver',
              label: 'Smart Saver',
            },
            available_presets: [
              { id: 'essentials', label: 'Essentials Basket' },
              { id: 'smart-saver', label: 'Smart Saver' },
              { id: 'market-fresh', label: 'Market Fresh' },
            ],
            summary: {
              total_lkr: 1600,
              available_items: 1,
              missing_items: 0,
            },
            items: [
              {
                label: 'Local coconut oil',
                kind: 'offer',
                price_lkr: 1600,
                source: 'spar2u',
              },
            ],
          })
        }

        return jsonResponse({
          preset: {
            id: 'essentials',
            label: 'Essentials Basket',
          },
          available_presets: [
            { id: 'essentials', label: 'Essentials Basket' },
            { id: 'smart-saver', label: 'Smart Saver' },
            { id: 'market-fresh', label: 'Market Fresh' },
          ],
          summary: {
            total_lkr: 1920,
            available_items: 2,
            missing_items: 0,
          },
          items: [
            {
              label: 'Local coconut oil',
              kind: 'offer',
              price_lkr: 1600,
              source: 'spar2u',
            },
            {
              label: 'Tomato',
              kind: 'market_quote',
              price_lkr: 320,
              source: 'Pettah',
            },
          ],
        })
      }

      return Promise.reject(new Error(`Unhandled fetch for ${url}`))
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders the expanded premium navigation', async () => {
    renderApp(['/'])

    expect(await screen.findByRole('link', { name: /intelligence/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /markets/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /basket/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /methods/i }).length).toBeGreaterThan(0)
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
    expect(screen.getByRole('heading', { name: /source freshness/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /developers/i }).length).toBeGreaterThan(0)
  })

  it('renders the markets page with wet-market data', async () => {
    renderApp(['/markets'])

    expect(await screen.findByRole('heading', { name: /markets/i })).toBeInTheDocument()
    expect(await screen.findByText(/pettah/i)).toBeInTheDocument()
    expect(await screen.findAllByText(/^tomato$/i)).toHaveLength(2)
  })

  it('renders category summary cards with real coverage counts', async () => {
    renderApp(['/categories'])

    expect(await screen.findByRole('heading', { name: /category intelligence/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /^grocery$/i })).toBeInTheDocument()
    expect(await screen.findByText(/retail offers 1/i)).toBeInTheDocument()
    expect(await screen.findByText(/market quotes 2/i)).toBeInTheDocument()
  })

  it('renders district comparison data', async () => {
    renderApp(['/compare'])

    expect(await screen.findByRole('heading', { name: /compare stores, districts, and food clusters/i })).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: /left district/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /right district/i })).toBeInTheDocument()
    expect(await screen.findByText(/colombo vs kandy/i)).toBeInTheDocument()
    expect(await screen.findByText(/tomato/i)).toBeInTheDocument()
    expect(await screen.findByText(/left cheaper by rs 20/i)).toBeInTheDocument()
  })

  it('renders basket estimates and can save them to watchlists', async () => {
    const user = userEvent.setup()
    localStorage.clear()

    const basketView = renderApp(['/basket'])

    expect(await screen.findByRole('heading', { name: /basket workspace/i })).toBeInTheDocument()
    expect(await screen.findByRole('combobox', { name: /basket preset/i })).toHaveValue('essentials')
    expect(await screen.findByText(/rs 1,920/i)).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /basket preset/i }), 'smart-saver')
    expect(await screen.findByRole('heading', { name: /smart saver/i })).toBeInTheDocument()
    expect((await screen.findAllByText(/rs 1,600/i)).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /save preset to watchlists/i }))
    expect(localStorage.getItem('food-platform.watchlists')).toContain('Smart Saver')

    basketView.unmount()
    renderApp(['/watchlists'])

    expect(await screen.findByRole('heading', { name: /watchlists/i })).toBeInTheDocument()
    expect(await screen.findByText(/smart saver/i)).toBeInTheDocument()
  })
})
