import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AgentPanel from '../app/components/AgentPanel'
import type { AgentDef } from '../app/components/agents-config'
import type { RunTaskPayload, EditSavePayload } from '../app/components/AgentPanel'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const mockAgent: AgentDef = {
  id: 'agent-test',
  name: 'TestBot',
  role: 'Tester',
  color: 0xff6b6b,
  startCol: 5,
  startRow: 5,
  goal: 'Run all tests',
  persona: 'Thorough and systematic',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel(
  agentDef: AgentDef | null = mockAgent,
  overrides: {
    onClose?: () => void
    onRunTask?: (p: RunTaskPayload) => void
    onEditSave?: (p: EditSavePayload) => void
  } = {},
) {
  const onClose = overrides.onClose ?? vi.fn()
  const onRunTask = overrides.onRunTask ?? vi.fn()
  const onEditSave = overrides.onEditSave ?? vi.fn()

  const result = render(
    <AgentPanel
      agentDef={agentDef}
      onClose={onClose}
      onRunTask={onRunTask}
      onEditSave={onEditSave}
    />,
  )

  return { onClose, onRunTask, onEditSave, ...result }
}

// ---------------------------------------------------------------------------
// Visibility
// ---------------------------------------------------------------------------

describe('AgentPanel visibility', () => {
  it('renders nothing when agentDef is null', () => {
    renderPanel(null)
    expect(screen.queryByTestId('agent-panel')).toBeNull()
  })

  it('renders the panel when agentDef is provided', () => {
    renderPanel()
    expect(screen.getByTestId('agent-panel')).toBeInTheDocument()
  })

  it('shows the agent name and role in the header', () => {
    renderPanel()
    expect(screen.getByText('TestBot')).toBeInTheDocument()
    expect(screen.getByText('Tester')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

describe('AgentPanel close', () => {
  it('calls onClose when the × button is clicked', () => {
    const { onClose } = renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /zavřít panel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const { onClose } = renderPanel()
    fireEvent.click(screen.getByTestId('agent-panel-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

describe('AgentPanel tabs', () => {
  it('defaults to Run mode (task textarea is visible)', () => {
    renderPanel()
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('switches to Edit mode when Edit tab is clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()
    expect(screen.queryByTestId('run-task-input')).toBeNull()
  })

  it('switches back to Run mode when Run tab is clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    fireEvent.click(screen.getByTestId('tab-run'))
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Run mode
// ---------------------------------------------------------------------------

describe('AgentPanel Run mode', () => {
  it('Spustit button is disabled when task is empty', () => {
    renderPanel()
    expect(screen.getByTestId('run-submit-btn')).toBeDisabled()
  })

  it('Spustit button is enabled when task has text', () => {
    renderPanel()
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: 'Do something useful' },
    })
    expect(screen.getByTestId('run-submit-btn')).toBeEnabled()
  })

  it('calls onRunTask with correct payload (delivery=wait by default)', () => {
    const { onRunTask } = renderPanel()
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: 'My task' },
    })
    fireEvent.click(screen.getByTestId('run-submit-btn'))
    expect(onRunTask).toHaveBeenCalledWith<[RunTaskPayload]>({
      agentId: 'agent-test',
      task: 'My task',
      delivery: 'wait',
    })
  })

  it('calls onRunTask with delivery=inbox when Inbox radio is selected', () => {
    const { onRunTask } = renderPanel()
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: 'Another task' },
    })
    fireEvent.click(screen.getByLabelText('Inbox'))
    fireEvent.click(screen.getByTestId('run-submit-btn'))
    expect(onRunTask).toHaveBeenCalledWith<[RunTaskPayload]>({
      agentId: 'agent-test',
      task: 'Another task',
      delivery: 'inbox',
    })
  })

  it('does not call onRunTask when task is whitespace only', () => {
    const { onRunTask } = renderPanel()
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByTestId('run-submit-btn'))
    expect(onRunTask).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Edit mode
// ---------------------------------------------------------------------------

describe('AgentPanel Edit mode', () => {
  beforeEach(() => {
    // Switch to Edit mode before each test
  })

  it('pre-fills name from agentDef', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLInputElement>('edit-name-input').value).toBe('TestBot')
  })

  it('pre-fills goal from agentDef', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-goal-input').value).toBe('Run all tests')
  })

  it('pre-fills persona from agentDef', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-persona-input').value).toBe(
      'Thorough and systematic',
    )
  })

  it('Uložit button is disabled when name is empty', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    fireEvent.change(screen.getByTestId('edit-name-input'), { target: { value: '' } })
    expect(screen.getByTestId('edit-save-btn')).toBeDisabled()
  })

  it('calls onEditSave with updated values', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))

    fireEvent.change(screen.getByTestId('edit-name-input'), {
      target: { value: 'NewName' },
    })
    fireEvent.change(screen.getByTestId('edit-goal-input'), {
      target: { value: 'New goal' },
    })
    fireEvent.change(screen.getByTestId('edit-persona-input'), {
      target: { value: 'New persona' },
    })
    fireEvent.click(screen.getByTestId('edit-save-btn'))

    expect(onEditSave).toHaveBeenCalledWith<[EditSavePayload]>({
      agentId: 'agent-test',
      name: 'NewName',
      goal: 'New goal',
      persona: 'New persona',
    })
  })

  it('calls onClose after saving', () => {
    const { onClose } = renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    fireEvent.click(screen.getByTestId('edit-save-btn'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('handles agent without goal or persona gracefully', () => {
    const agentWithoutOptionals: AgentDef = {
      id: 'agent-bare',
      name: 'Bare',
      role: 'Basic',
      color: 0x4ecdc4,
      startCol: 0,
      startRow: 0,
    }
    renderPanel(agentWithoutOptionals)
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-goal-input').value).toBe('')
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-persona-input').value).toBe('')
  })
})

// ---------------------------------------------------------------------------
// State reset on agent change
// ---------------------------------------------------------------------------

describe('AgentPanel state reset', () => {
  it('resets to Run mode when a new agent is shown', () => {
    const { rerender } = renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()

    const anotherAgent: AgentDef = {
      ...mockAgent,
      id: 'agent-other',
      name: 'OtherBot',
    }
    rerender(
      <AgentPanel
        agentDef={anotherAgent}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
      />,
    )

    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('resets task input when a new agent is shown', () => {
    const { rerender } = renderPanel()
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: 'Old task' },
    })

    const anotherAgent: AgentDef = {
      ...mockAgent,
      id: 'agent-other',
      name: 'OtherBot',
    }
    rerender(
      <AgentPanel
        agentDef={anotherAgent}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
      />,
    )

    expect(screen.getByTestId<HTMLTextAreaElement>('run-task-input').value).toBe('')
  })
})
