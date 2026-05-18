import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { LocaleProvider } from '../i18n/locale-provider'
import { ChangesPage } from './changes-page'

vi.mock('../lib/api', () => ({
  api: {
    getPriceChanges: vi.fn().mockResolvedValue({
      items: [
        {
          kind: 'retail_offer',
          source: 'spar2u',
          label: 'Coconut Oil',
          price_lkr: 1600,
          observed_at: '2026-05-18T00:00:00+00:00',
          direction: 'up',
          delta_vs_median_pct: 5.9,
        },
      ],
      counts: { retail: 1, market: 0, total: 1 },
    }),
  },
}))

function renderChanges() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter>
          <ChangesPage />
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  )
}

describe('ChangesPage', () => {
  it('renders price change rows from the API', async () => {
    renderChanges()
    await waitFor(() => {
      expect(screen.getByText('Coconut Oil')).toBeInTheDocument()
    })
    expect(screen.getByText(/spar2u/i)).toBeInTheDocument()
  })
})
