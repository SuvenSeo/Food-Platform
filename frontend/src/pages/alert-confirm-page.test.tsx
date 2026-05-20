import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'

import { AlertConfirmPage } from './alert-confirm-page'

function renderConfirmPage(path = '/alerts/confirm?token=abc123') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/alerts/confirm" element={<AlertConfirmPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AlertConfirmPage', () => {
  it('confirms the token from the email query string', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, confirmed: true, active: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    renderConfirmPage()

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/alerts/confirm/abc123', expect.objectContaining({ method: 'POST' }))
    })
    expect(await screen.findByRole('heading', { name: /alert confirmed/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /price catalog/i })).toHaveAttribute('href', '/prices')

    fetchMock.mockRestore()
  })

  it('explains when the email link is missing a token', () => {
    renderConfirmPage('/alerts/confirm')

    expect(screen.getByRole('heading', { name: /confirmation link is incomplete/i })).toBeInTheDocument()
    expect(screen.getByText(/open the newest email/i)).toBeInTheDocument()
  })
})
