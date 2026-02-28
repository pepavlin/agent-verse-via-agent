import { describe, it, expect, vi, beforeEach } from 'vitest'
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
})

// ---------------------------------------------------------------------------
// Agent context section (goal + persona in Run tab)
// ---------------------------------------------------------------------------

describe('AgentPanel agent context section', () => {
  it('shows agent context section in Run tab', () => {
    renderPanel()
    expect(screen.getByTestId('agent-context-section')).toBeInTheDocument()
  })

  it('displays goal text in the context section', () => {
    renderPanel()
    expect(screen.getByTestId('inline-goal-display')).toHaveTextContent('Run all tests')
  })

  it('displays persona text in the context section', () => {
    renderPanel()
    expect(screen.getByTestId('inline-persona-display')).toHaveTextContent('Thorough and systematic')
  })

  it('shows placeholder text for empty goal', () => {
    const agentNoGoal: AgentDef = { ...mockAgent, goal: undefined }
    renderPanel(agentNoGoal)
    expect(screen.getByTestId('inline-goal-display')).toBeInTheDocument()
  })

  it('context section is not visible in Edit mode', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.queryByTestId('agent-context-section')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Inline goal editing (in Run tab)
// ---------------------------------------------------------------------------

describe('AgentPanel inline goal editing', () => {
  it('shows edit button for goal', () => {
    renderPanel()
    expect(screen.getByTestId('inline-goal-edit-btn')).toBeInTheDocument()
  })

  it('clicking edit goal button shows the inline input', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('inline-goal-edit-btn'))
    expect(screen.getByTestId('inline-goal-input')).toBeInTheDocument()
    expect(screen.queryByTestId('inline-goal-display')).toBeNull()
  })

  it('inline goal input is seeded with current goal value', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('inline-goal-edit-btn'))
    expect(screen.getByTestId<HTMLTextAreaElement>('inline-goal-input').value).toBe('Run all tests')
  })

  it('confirm goal save calls onEditSave with updated goal', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-goal-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-goal-input'), {
      target: { value: 'New goal text' },
    })
    fireEvent.click(screen.getByTestId('inline-goal-confirm'))
    expect(onEditSave).toHaveBeenCalledWith<[EditSavePayload]>({
      agentId: 'agent-test',
      name: 'TestBot',
      goal: 'New goal text',
      persona: 'Thorough and systematic',
    })
  })

  it('cancelling goal edit restores the display without calling onEditSave', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-goal-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-goal-input'), {
      target: { value: 'Discarded goal' },
    })
    fireEvent.click(screen.getByTestId('inline-goal-cancel'))
    expect(onEditSave).not.toHaveBeenCalled()
    expect(screen.getByTestId('inline-goal-display')).toHaveTextContent('Run all tests')
  })

  it('Escape key cancels inline goal edit', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-goal-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-goal-input'), {
      target: { value: 'Discarded' },
    })
    fireEvent.keyDown(screen.getByTestId('inline-goal-input'), { key: 'Escape' })
    expect(onEditSave).not.toHaveBeenCalled()
    expect(screen.getByTestId('inline-goal-display')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Inline persona editing (in Run tab)
// ---------------------------------------------------------------------------

describe('AgentPanel inline persona editing', () => {
  it('shows edit button for persona', () => {
    renderPanel()
    expect(screen.getByTestId('inline-persona-edit-btn')).toBeInTheDocument()
  })

  it('clicking edit persona button shows the inline input', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('inline-persona-edit-btn'))
    expect(screen.getByTestId('inline-persona-input')).toBeInTheDocument()
    expect(screen.queryByTestId('inline-persona-display')).toBeNull()
  })

  it('inline persona input is seeded with current persona value', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('inline-persona-edit-btn'))
    expect(screen.getByTestId<HTMLTextAreaElement>('inline-persona-input').value).toBe(
      'Thorough and systematic',
    )
  })

  it('confirm persona save calls onEditSave with updated persona', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-persona-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-persona-input'), {
      target: { value: 'New persona description' },
    })
    fireEvent.click(screen.getByTestId('inline-persona-confirm'))
    expect(onEditSave).toHaveBeenCalledWith<[EditSavePayload]>({
      agentId: 'agent-test',
      name: 'TestBot',
      goal: 'Run all tests',
      persona: 'New persona description',
    })
  })

  it('cancelling persona edit restores the display without calling onEditSave', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-persona-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-persona-input'), {
      target: { value: 'Discarded persona' },
    })
    fireEvent.click(screen.getByTestId('inline-persona-cancel'))
    expect(onEditSave).not.toHaveBeenCalled()
    expect(screen.getByTestId('inline-persona-display')).toHaveTextContent('Thorough and systematic')
  })
})

// ---------------------------------------------------------------------------
// Inline name editing (in header)
// ---------------------------------------------------------------------------

describe('AgentPanel inline name editing', () => {
  it('shows the edit name button', () => {
    renderPanel()
    expect(screen.getByTestId('inline-name-edit-btn')).toBeInTheDocument()
  })

  it('clicking edit name button shows the inline input', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    expect(screen.getByTestId('inline-name-input')).toBeInTheDocument()
    expect(screen.getByTestId('inline-name-edit')).toBeInTheDocument()
  })

  it('inline name input is seeded with current name', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    expect(screen.getByTestId<HTMLInputElement>('inline-name-input').value).toBe('TestBot')
  })

  it('confirming name edit calls onEditSave with updated name', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-name-input'), {
      target: { value: 'RenamedBot' },
    })
    fireEvent.click(screen.getByTestId('inline-name-confirm'))
    expect(onEditSave).toHaveBeenCalledWith<[EditSavePayload]>({
      agentId: 'agent-test',
      name: 'RenamedBot',
      goal: 'Run all tests',
      persona: 'Thorough and systematic',
    })
  })

  it('Enter key confirms the inline name edit', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-name-input'), {
      target: { value: 'EnterBot' },
    })
    fireEvent.keyDown(screen.getByTestId('inline-name-input'), { key: 'Enter' })
    expect(onEditSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'EnterBot' }),
    )
  })

  it('Escape key cancels the inline name edit', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-name-input'), {
      target: { value: 'ShouldNotSave' },
    })
    fireEvent.keyDown(screen.getByTestId('inline-name-input'), { key: 'Escape' })
    expect(onEditSave).not.toHaveBeenCalled()
    // The original name should still appear
    expect(screen.getByText('TestBot')).toBeInTheDocument()
  })

  it('cancelling name edit via cancel button restores original name', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-name-input'), {
      target: { value: 'Discarded Name' },
    })
    fireEvent.click(screen.getByTestId('inline-name-cancel'))
    expect(onEditSave).not.toHaveBeenCalled()
    expect(screen.getByText('TestBot')).toBeInTheDocument()
  })

  it('empty name reverts to previous value without calling onEditSave', () => {
    const { onEditSave } = renderPanel()
    fireEvent.click(screen.getByTestId('inline-name-edit-btn'))
    fireEvent.change(screen.getByTestId('inline-name-input'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByTestId('inline-name-confirm'))
    expect(onEditSave).not.toHaveBeenCalled()
    expect(screen.getByText('TestBot')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Edit mode (full Edit tab)
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
      configVersion: 1,
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

  it('resets inline goal edit state when a new agent is shown', () => {
    const { rerender } = renderPanel()
    // Start editing the goal
    fireEvent.click(screen.getByTestId('inline-goal-edit-btn'))
    expect(screen.getByTestId('inline-goal-input')).toBeInTheDocument()

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

    // Should no longer be in inline edit mode
    expect(screen.queryByTestId('inline-goal-input')).toBeNull()
    expect(screen.getByTestId('inline-goal-display')).toHaveTextContent('Different goal')
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
