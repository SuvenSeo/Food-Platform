import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { MarketPulseChartView } from './market-pulse-chart'

describe('MarketPulseChartView', () => {
  it('renders a compact pulse chart with coverage leaders', () => {
    render(
      <MemoryRouter>
        <MarketPulseChartView
          activeItem="Tomato"
          totalDataPoints={44}
          topItems={[
            { item_name: 'Tomato', data_points: 24, earliest: '2026-01', latest: '2026-05', avg_price_lkr: 320 },
            { item_name: 'Carrot', data_points: 20, earliest: '2026-01', latest: '2026-05', avg_price_lkr: 480 },
          ]}
          chartData={[
            { period: '2026-01', price: 300, min: 280, max: 330, dataPoints: 8 },
            { period: '2026-02', price: 340, min: 310, max: 370, dataPoints: 9 },
            { period: '2026-03', price: 320, min: 300, max: 350, dataPoints: 7 },
          ]}
        />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/market pulse/i)).toBeInTheDocument()
    expect(screen.getByText(/the clearest price signal right now/i)).toBeInTheDocument()
    expect(screen.getAllByText('Tomato').length).toBeGreaterThan(0)
    expect(screen.getByText(/coverage leaders/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /price trend for tomato/i })).toBeInTheDocument()
  })
})
