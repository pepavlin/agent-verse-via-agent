import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AgentPanel from '../app/components/AgentPanel'
import type { AgentDef } from '../app/components/agents-config'
import type { RunTaskPayload, EditSavePayload, WaitRunPhase } from '../app/components/AgentPanel'

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
  configVersion: 1,
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
    onNewTask?: () => void
    waitPhase?: WaitRunPhase
    waitResult?: string
    waitError?: string
  } = {},
) {
  const onClose = overrides.onClose ?? vi.fn()
  const onRunTask = overrides.onRunTask ?? vi.fn()
  const onEditSave = overrides.onEditSave ?? vi.fn()
  const onNewTask = overrides.onNewTask ?? vi.fn()

  const result = render(
    <AgentPanel
      agentDef={agentDef}
      onClose={onClose}
      onRunTask={onRunTask}
      onEditSave={onEditSave}
      onNewTask={onNewTask}
      waitPhase={overrides.waitPhase}
      waitResult={overrides.waitResult}
      waitError={overrides.waitError}
    />,
  )

  return { onClose, onRunTask, onEditSave, onNewTask, ...result }
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

  it('shows the agent name in the header', () => {
    renderPanel()
    expect(screen.getByTestId('agent-panel-name')).toHaveTextContent('TestBot')
  })

  it('shows the agent role in the header', () => {
    renderPanel()
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
// Run mode — clean interface: only textarea, delivery choice, Spustit button
// ---------------------------------------------------------------------------

describe('AgentPanel Run mode', () => {
  it('shows only the task textarea, delivery toggle, and submit button', () => {
    renderPanel()
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Počkat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inbox' })).toBeInTheDocument()
    expect(screen.getByTestId('run-submit-btn')).toBeInTheDocument()
  })

  it('does not show agent goal or persona in Run mode', () => {
    renderPanel()
    // Goal and persona are only available in Edit mode
    expect(screen.queryByTestId('agent-context-section')).toBeNull()
    expect(screen.queryByTestId('edit-goal-input')).toBeNull()
    expect(screen.queryByTestId('edit-persona-input')).toBeNull()
  })

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

  it('calls onRunTask with delivery=inbox when Inbox button is selected', () => {
    const { onRunTask } = renderPanel()
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: 'Another task' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inbox' }))
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

  it('shows delegation label when agent has child agents', () => {
    const childAgent: AgentDef = { ...mockAgent, id: 'agent-child', name: 'Child' }
    render(
      <AgentPanel
        agentDef={mockAgent}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
        childAgentDefs={[childAgent]}
      />,
    )
    fireEvent.change(screen.getByTestId('run-task-input'), {
      target: { value: 'Delegate this' },
    })
    expect(screen.getByTestId('run-submit-btn')).toHaveTextContent('Spustit s delegací')
  })
})

// ---------------------------------------------------------------------------
// Edit mode — name, goal, persona
// ---------------------------------------------------------------------------

describe('AgentPanel Edit mode', () => {
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
      configVersion: 1,
    }
    renderPanel(agentWithoutOptionals)
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-goal-input').value).toBe('')
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-persona-input').value).toBe('')
  })

  it('does not show Run form elements in Edit mode', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.queryByTestId('run-task-input')).toBeNull()
    expect(screen.queryByTestId('run-submit-btn')).toBeNull()
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

  it('updates Edit form fields when a new agent is shown', () => {
    const { rerender } = renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLInputElement>('edit-name-input').value).toBe('TestBot')

    const anotherAgent: AgentDef = {
      ...mockAgent,
      id: 'agent-other',
      name: 'OtherBot',
      goal: 'Different goal',
    }
    rerender(
      <AgentPanel
        agentDef={anotherAgent}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
      />,
    )

    // Mode resets to run, so switch to edit to verify fields
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId<HTMLInputElement>('edit-name-input').value).toBe('OtherBot')
    expect(screen.getByTestId<HTMLTextAreaElement>('edit-goal-input').value).toBe('Different goal')
  })
})

// ---------------------------------------------------------------------------
// Wait-delivery result states
// ---------------------------------------------------------------------------

describe('AgentPanel wait-delivery: idle', () => {
  it('shows the run form when waitPhase is idle (default)', () => {
    renderPanel()
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
    expect(screen.queryByTestId('wait-running-indicator')).toBeNull()
    expect(screen.queryByTestId('wait-result-panel')).toBeNull()
  })

  it('shows the run form when waitPhase is explicitly idle', () => {
    renderPanel(mockAgent, { waitPhase: 'idle' })
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })
})

describe('AgentPanel wait-delivery: running', () => {
  it('shows spinner and hides run form when waitPhase is running', () => {
    renderPanel(mockAgent, { waitPhase: 'running' })
    expect(screen.getByTestId('wait-running-indicator')).toBeInTheDocument()
    expect(screen.queryByTestId('run-task-input')).toBeNull()
    expect(screen.queryByTestId('wait-result-panel')).toBeNull()
  })

  it('shows "Zpracovávám…" text when running', () => {
    renderPanel(mockAgent, { waitPhase: 'running' })
    expect(screen.getByText('Zpracovávám…')).toBeInTheDocument()
  })
})

describe('AgentPanel wait-delivery: done', () => {
  it('shows result panel and hides run form when waitPhase is done', () => {
    renderPanel(mockAgent, { waitPhase: 'done', waitResult: 'Task completed.' })
    expect(screen.getByTestId('wait-result-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('run-task-input')).toBeNull()
    expect(screen.queryByTestId('wait-running-indicator')).toBeNull()
  })

  it('displays the result text', () => {
    renderPanel(mockAgent, { waitPhase: 'done', waitResult: 'Everything went well.' })
    expect(screen.getByText('Everything went well.')).toBeInTheDocument()
  })

  it('shows "Hotovo" status label', () => {
    renderPanel(mockAgent, { waitPhase: 'done', waitResult: 'Done.' })
    expect(screen.getByText('Hotovo')).toBeInTheDocument()
  })

  it('shows "Nový úkol" button', () => {
    renderPanel(mockAgent, { waitPhase: 'done', waitResult: 'Done.' })
    expect(screen.getByTestId('wait-new-task-btn')).toBeInTheDocument()
  })

  it('calls onNewTask when "Nový úkol" is clicked', () => {
    const { onNewTask } = renderPanel(mockAgent, { waitPhase: 'done', waitResult: 'Done.' })
    fireEvent.click(screen.getByTestId('wait-new-task-btn'))
    expect(onNewTask).toHaveBeenCalledOnce()
  })
})

describe('AgentPanel wait-delivery: error', () => {
  it('shows result panel with error when waitPhase is error', () => {
    renderPanel(mockAgent, { waitPhase: 'error', waitError: 'Something failed.' })
    expect(screen.getByTestId('wait-result-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('run-task-input')).toBeNull()
    expect(screen.queryByTestId('wait-running-indicator')).toBeNull()
  })

  it('displays the error text', () => {
    renderPanel(mockAgent, { waitPhase: 'error', waitError: 'Connection refused.' })
    expect(screen.getByText('Connection refused.')).toBeInTheDocument()
  })

  it('shows "Chyba" status label', () => {
    renderPanel(mockAgent, { waitPhase: 'error', waitError: 'Oops.' })
    expect(screen.getByText('Chyba')).toBeInTheDocument()
  })

  it('calls onNewTask when "Nový úkol" is clicked in error state', () => {
    const { onNewTask } = renderPanel(mockAgent, { waitPhase: 'error', waitError: 'Failed.' })
    fireEvent.click(screen.getByTestId('wait-new-task-btn'))
    expect(onNewTask).toHaveBeenCalledOnce()
  })
})

describe('AgentPanel wait-delivery: Edit tab still works during non-idle phase', () => {
  it('can switch to Edit tab while running', () => {
    renderPanel(mockAgent, { waitPhase: 'running' })
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()
  })

  it('can switch to Edit tab after done', () => {
    renderPanel(mockAgent, { waitPhase: 'done', waitResult: 'Finished.' })
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()
  })
})
