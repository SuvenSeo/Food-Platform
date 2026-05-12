import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'

import { IntelligencePage } from './intelligence-page'
import { useIntelligenceBrief } from '../hooks/use-intelligence-brief'
import { useIntelligenceSummary } from '../hooks/use-intelligence-summary'

vi.mock('../hooks/use-intelligence-brief', () => ({
  useIntelligenceBrief: vi.fn(),
}))

vi.mock('../hooks/use-intelligence-summary', () => ({
  useIntelligenceSummary: vi.fn(),
}))

const mockedUseIntelligenceBrief = vi.mocked(useIntelligenceBrief)
const mockedUseIntelligenceSummary = vi.mocked(useIntelligenceSummary)

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <IntelligencePage />
    </QueryClientProvider>,
  )
}

describe('IntelligencePage null-safety', () => {
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
})
