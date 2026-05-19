import { render, screen } from '@testing-library/react'

import { SectionHeader } from './section-header'

describe('SectionHeader', () => {
  it('renders a page-level heading by default', () => {
    render(<SectionHeader eyebrow="Markets" title="Market prices" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Market prices' })).toBeInTheDocument()
  })

  it('can render nested section headings when requested', () => {
    render(<SectionHeader eyebrow="Related" title="Similar offers" level="h2" />)

    expect(screen.getByRole('heading', { level: 2, name: 'Similar offers' })).toBeInTheDocument()
  })
})
