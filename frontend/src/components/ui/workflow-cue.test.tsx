import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { WorkflowCue } from './workflow-cue'

function renderCue() {
  return render(
    <MemoryRouter>
      <WorkflowCue
        id="test-cue"
        eyebrow="Start"
        title="Use the guided path."
        body="Search, compare, then save the useful result."
        points={['Search item', 'Compare gap', 'Save result']}
        actionLabel="Open prices"
        actionTo="/items"
      />
    </MemoryRouter>,
  )
}

describe('WorkflowCue', () => {
  it('persists dismissal in local storage', () => {
    const { rerender } = renderCue()

    expect(screen.getByText(/use the guided path/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /dismiss use the guided path/i }))
    expect(screen.queryByText(/use the guided path/i)).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <WorkflowCue
          id="test-cue"
          eyebrow="Start"
          title="Use the guided path."
          body="Search, compare, then save the useful result."
        />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/use the guided path/i)).not.toBeInTheDocument()
  })
})
