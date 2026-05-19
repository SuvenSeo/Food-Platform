import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { TrustCommandRail } from './trust-command-rail'
import type { PlatformFreshnessSummary } from '../../types'

const freshness: PlatformFreshnessSummary = {
  generated_at: '2026-05-19T08:00:00+05:30',
  freshness: {
    last_scrape_at: '2026-05-19T07:45:00+05:30',
    last_offer_seen_at: '2026-05-19T07:45:00+05:30',
    last_market_quote_at: '2026-05-19T07:30:00+05:30',
    scrape_latency_minutes: 15,
  },
  coverage: {
    offers_count: 240,
    market_quotes_count: 96,
    sources_count: 8,
    categories_count: 12,
  },
  pipeline: {
    healthy_sources: 6,
    degraded_sources: 2,
    total_sources: 8,
    latest_status: 'success',
    source_health_ratio: 0.75,
    blocking_warnings: ['DOA market sync is stale'],
  },
  confidence: {
    score: 0.72,
    grade: 'medium',
    note: 'Most feeds are fresh, but market sync needs attention.',
  },
}

describe('TrustCommandRail', () => {
  it('surfaces trust status, source coverage, and workflow links', () => {
    render(
      <MemoryRouter>
        <TrustCommandRail freshness={freshness} />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/platform trust and quick actions/i)).toBeInTheDocument()
    expect(screen.getByText(/watch mode/i)).toBeInTheDocument()
    expect(screen.getByText('6/8')).toBeInTheDocument()
    expect(screen.getByText(/1 expected feeds need attention/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pipeline/i })).toHaveAttribute('href', '/pipeline')
    expect(screen.getByRole('link', { name: /api/i })).toHaveAttribute('href', '/developers')
  })
})
