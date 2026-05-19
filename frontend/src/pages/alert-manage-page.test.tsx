import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

import { AlertManagePage } from './alert-manage-page'

function renderManagePage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/alerts/manage/tok123']}>
        <Routes>
          <Route path="/alerts/manage/:token" element={<AlertManagePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AlertManagePage', () => {
  it('loads the subscription attached to the manage token', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          subscription: {
            id: 7,
            email: 'alerts@example.com',
            scope: 'category',
            scope_value: 'vegetables',
            cadence: 'daily',
            active: true,
            confirmed: true,
            created_at: '2026-05-19T00:00:00+00:00',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    renderManagePage()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/alerts/manage/tok123')
    })
    expect(await screen.findByRole('heading', { name: /manage price alert/i })).toBeInTheDocument()
    expect(screen.getByText('alerts@example.com')).toBeInTheDocument()
    expect(screen.getByText(/vegetables/i)).toBeInTheDocument()

    fetchMock.mockRestore()
  })
})
