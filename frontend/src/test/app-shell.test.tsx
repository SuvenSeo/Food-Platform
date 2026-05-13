import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '../components/layout/app-shell'

function renderShell() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="*"
            element={
              <AppShell>
                <div data-testid="content">Hello FoodLK</div>
              </AppShell>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AppShell', () => {
  it('renders the primary navigation links', async () => {
    renderShell()

    // The shell renders both the desktop pill nav and the mobile drawer nav,
    // so several link labels appear twice in the DOM. We just assert presence.
    expect(await screen.findByRole('link', { name: /foodlk home/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /^home$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^retail$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^markets$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^intelligence$/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^basket$/i }).length).toBeGreaterThan(0)
  })

  it('renders its children', async () => {
    renderShell()

    expect(await screen.findByTestId('content')).toHaveTextContent('Hello FoodLK')
  })
})
