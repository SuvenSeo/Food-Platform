import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { IntelligencePage } from './intelligence-page'
import { useIntelligenceBrief } from '../hooks/use-intelligence-brief'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'
import { useMarketTrend } from '../hooks/use-market-trend'
import { useTrendsSummary } from '../hooks/use-trends-summary'

vi.mock('../hooks/use-intelligence-brief', () => ({
  useIntelligenceBrief: vi.fn(),
}))

vi.mock('../hooks/use-intelligence-summary', () => ({
  useIntelligenceSummary: vi.fn(),
}))

vi.mock('../hooks/use-trends-summary', () => ({
  useTrendsSummary: vi.fn(),
}))

vi.mock('../hooks/use-market-trend', () => ({
  useMarketTrend: vi.fn(),
}))

const mockedUseIntelligenceBrief = vi.mocked(useIntelligenceBrief)
const mockedUseIntelligenceSummary = vi.mocked(useIntelligenceSummary)
const mockedUseTrendsSummary = vi.mocked(useTrendsSummary)
const mockedUseMarketTrend = vi.mocked(useMarketTrend)

function mockTrendHooksEmpty() {
  mockedUseTrendsSummary.mockReturnValue({
    isLoading: false,
    isError: false,
    data: { total_market_data_points: 0, top_items: [], sources: [] },
  } as unknown as ReturnType<typeof useTrendsSummary>)

  mockedUseMarketTrend.mockReturnValue({
    isLoading: false,
    isError: false,
    data: { item: '', district: null, granularity: 'monthly', series: [], total_data_points: 0, date_range: { from: null, to: null } },
  } as unknown as ReturnType<typeof useMarketTrend>)
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <IntelligencePage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('IntelligencePage null-safety', () => {
  beforeEach(() => {
    mockTrendHooksEmpty()
  })

  it('renders graceful fallback content when brief payload is missing nested data', async () => {
    mockedUseIntelligenceSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        rankings: {
          top_value: [],
          trend_snapshot: [],
        },
        sources: [],
      },
    } as unknown as ReturnType<typeof useIntelligenceSummary>)

    mockedUseIntelligenceBrief.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        generated_at: null,
      },
    } as unknown as ReturnType<typeof useIntelligenceBrief>)

    renderPage()

    expect(await screen.findByText(/brief currently unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/recommended actions/i)).toBeInTheDocument()
    expect(screen.getByText(/no recommendations available right now/i)).toBeInTheDocument()
  })

  it('shows partial-data warning when a query fails', async () => {
    mockedUseIntelligenceSummary.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as unknown as ReturnType<typeof useIntelligenceSummary>)

    mockedUseIntelligenceBrief.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as unknown as ReturnType<typeof useIntelligenceBrief>)

    renderPage()

    expect(await screen.findByText(/some intelligence modules are temporarily unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/highlights unavailable right now/i)).toBeInTheDocument()
    expect(screen.getByText(/top-value offers are unavailable right now/i)).toBeInTheDocument()
  })

  it('shows market trend empty state when series has no points', async () => {
    mockedUseIntelligenceSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        rankings: { top_value: [], trend_snapshot: [] },
        sources: [],
      },
    } as unknown as ReturnType<typeof useIntelligenceSummary>)

    mockedUseIntelligenceBrief.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        generated_at: null,
        brief: {
          urgency: 'routine',
          headline: 'Stable',
          highlights: [],
          recommendations: [],
        },
      },
    } as unknown as ReturnType<typeof useIntelligenceBrief>)

    renderPage()

    expect(await screen.findByText(/no market trend series yet/i)).toBeInTheDocument()
  })
})
