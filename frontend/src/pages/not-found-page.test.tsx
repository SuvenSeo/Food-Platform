import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { NotFoundPage } from './not-found-page'

describe('NotFoundPage', () => {
  it('renders a usable recovery route set', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /404/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /prices/i })).toHaveAttribute('href', '/items')
    expect(screen.getByRole('link', { name: /markets/i })).toHaveAttribute('href', '/markets')
    expect(screen.getByRole('link', { name: /compare/i })).toHaveAttribute('href', '/compare')
    expect(screen.getByRole('link', { name: /basket/i })).toHaveAttribute('href', '/basket')
  })
})
