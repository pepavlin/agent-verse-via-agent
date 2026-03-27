import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AgentPanel from '../app/components/AgentPanel'
import type { AgentDef } from '../app/components/agents-config'
import type { RunTaskPayload, EditSavePayload, WaitRunPhase } from '../app/components/AgentPanel'
import type { AgentHistoryEntry } from '../app/components/use-agent-history'

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

const doneEntry: AgentHistoryEntry = {
  id: 'run-1',
  agentId: 'agent-test',
  task: 'Explore the sector',
  result: 'Exploration complete.',
  status: 'done',
  timestamp: new Date('2026-02-28T12:00:00Z').toISOString(),
}

const pendingEntry: AgentHistoryEntry = {
  id: 'run-2',
  agentId: 'agent-test',
  task: 'Build something',
  status: 'pending',
  timestamp: new Date('2026-02-28T12:05:00Z').toISOString(),
}

const errorEntry: AgentHistoryEntry = {
  id: 'run-3',
  agentId: 'agent-test',
  task: 'Scout the area',
  result: 'API key missing.',
  status: 'error',
  timestamp: new Date('2026-02-28T12:10:00Z').toISOString(),
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPanel(
  agentDef: AgentDef | null = mockAgent,
  overrides: {
    history?: AgentHistoryEntry[]
    onClose?: () => void
    onRunTask?: (p: RunTaskPayload) => void
    onEditSave?: (p: EditSavePayload) => void
    onClearHistory?: () => void
    onNewTask?: () => void
    waitPhase?: WaitRunPhase
    waitResult?: string
    waitError?: string
  } = {},
) {
  const onClose = overrides.onClose ?? vi.fn()
  const onRunTask = overrides.onRunTask ?? vi.fn()
  const onEditSave = overrides.onEditSave ?? vi.fn()
  const onClearHistory = overrides.onClearHistory ?? vi.fn()
  const onNewTask = overrides.onNewTask ?? vi.fn()
  const history = overrides.history ?? []

  const result = render(
    <AgentPanel
      agentDef={agentDef}
      history={history}
      onClose={onClose}
      onRunTask={onRunTask}
      onEditSave={onEditSave}
      onNewTask={onNewTask}
      onClearHistory={onClearHistory}
      waitPhase={overrides.waitPhase}
      waitResult={overrides.waitResult}
      waitError={overrides.waitError}
    />,
  )

  return { onClose, onRunTask, onEditSave, onNewTask, onClearHistory, ...result }
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
  it('defaults to Chat mode (task textarea is visible)', () => {
    renderPanel()
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('shows Chat tab button', () => {
    renderPanel()
    expect(screen.getByTestId('tab-chat')).toBeInTheDocument()
  })

  it('shows Edit tab button', () => {
    renderPanel()
    expect(screen.getByTestId('tab-edit')).toBeInTheDocument()
  })

  it('switches to Edit mode when Edit tab is clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()
    expect(screen.queryByTestId('run-task-input')).toBeNull()
  })

  it('switches back to Chat mode when Chat tab is clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-edit'))
    fireEvent.click(screen.getByTestId('tab-chat'))
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('Chat tab label shows entry count when history is non-empty', () => {
    renderPanel(mockAgent, { history: [doneEntry, pendingEntry] })
    const chatTab = screen.getByTestId('tab-chat')
    expect(chatTab.textContent).toContain('2')
  })

  it('Chat tab label shows no count when history is empty', () => {
    renderPanel(mockAgent, { history: [] })
    const chatTab = screen.getByTestId('tab-chat')
    expect(chatTab.textContent).not.toMatch(/\(\d+\)/)
  })

  it('does not render a separate History tab', () => {
    renderPanel()
    expect(screen.queryByTestId('tab-history')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Chat mode — task input
// ---------------------------------------------------------------------------

describe('AgentPanel Chat mode — task input', () => {
  it('send button is disabled when task is empty', () => {
    renderPanel()
    expect(screen.getByTestId('run-submit-btn')).toBeDisabled()
  })

  it('send button is enabled when task has text', () => {
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
// Chat mode — history is always visible alongside the input
// ---------------------------------------------------------------------------

describe('AgentPanel Chat mode — history visible with input', () => {
  it('shows empty state AND input when there is no history', () => {
    renderPanel(mockAgent, { history: [] })
    expect(screen.getByTestId('history-empty')).toBeInTheDocument()
    // Input is always present in chat mode
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('shows history list AND input when history has entries', () => {
    renderPanel(mockAgent, { history: [doneEntry] })
    expect(screen.getByTestId('history-list')).toBeInTheDocument()
    // Input is still visible below history
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('task input and history list are simultaneously visible (no tab switch needed)', () => {
    renderPanel(mockAgent, { history: [doneEntry, pendingEntry] })
    expect(screen.getByTestId('history-list')).toBeInTheDocument()
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
    expect(screen.getByTestId('run-submit-btn')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Edit mode
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
// Chat mode — empty state
// ---------------------------------------------------------------------------

describe('AgentPanel Chat mode — empty', () => {
  it('shows empty state when there is no history', () => {
    renderPanel(mockAgent, { history: [] })
    expect(screen.getByTestId('history-empty')).toBeInTheDocument()
  })

  it('empty state contains a descriptive message', () => {
    renderPanel(mockAgent, { history: [] })
    expect(screen.getByText('Žádná historie')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Chat mode — with entries
// ---------------------------------------------------------------------------

describe('AgentPanel Chat mode — entries', () => {
  it('renders a done entry with task text and result', () => {
    renderPanel(mockAgent, { history: [doneEntry] })

    expect(screen.getByTestId(`history-entry-${doneEntry.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`history-task-${doneEntry.id}`)).toHaveTextContent(doneEntry.task)
    expect(screen.getByTestId(`history-result-${doneEntry.id}`)).toHaveTextContent(doneEntry.result!)
  })

  it('renders a pending entry with loading indicator', () => {
    renderPanel(mockAgent, { history: [pendingEntry] })

    expect(screen.getByTestId(`history-task-${pendingEntry.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`history-pending-${pendingEntry.id}`)).toBeInTheDocument()
    expect(screen.queryByTestId(`history-result-${pendingEntry.id}`)).toBeNull()
  })

  it('renders an error entry with error message', () => {
    renderPanel(mockAgent, { history: [errorEntry] })

    expect(screen.getByTestId(`history-error-${errorEntry.id}`)).toHaveTextContent(errorEntry.result!)
  })

  it('renders multiple entries', () => {
    renderPanel(mockAgent, { history: [doneEntry, pendingEntry, errorEntry] })

    expect(screen.getByTestId(`history-entry-${doneEntry.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`history-entry-${pendingEntry.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`history-entry-${errorEntry.id}`)).toBeInTheDocument()
  })

  it('shows the history list container', () => {
    renderPanel(mockAgent, { history: [doneEntry] })
    expect(screen.getByTestId('history-list')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Chat mode — clear button
// ---------------------------------------------------------------------------

describe('AgentPanel Chat mode — clear', () => {
  it('shows clear history button when there are entries', () => {
    renderPanel(mockAgent, { history: [doneEntry] })
    expect(screen.getByTestId('history-clear-btn')).toBeInTheDocument()
  })

  it('does not show clear button when history is empty', () => {
    renderPanel(mockAgent, { history: [] })
    expect(screen.queryByTestId('history-clear-btn')).toBeNull()
  })

  it('calls onClearHistory when clear button is clicked', () => {
    const onClearHistory = vi.fn()
    renderPanel(mockAgent, { history: [doneEntry], onClearHistory })
    fireEvent.click(screen.getByTestId('history-clear-btn'))
    expect(onClearHistory).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// historyBump — ensures chat mode stays active
// ---------------------------------------------------------------------------

describe('AgentPanel historyBump', () => {
  it('stays on Chat tab when historyBump is 0', () => {
    renderPanel(mockAgent, {})
    // By default historyBump=0 → Chat tab stays active (input visible)
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('returns to Chat tab when historyBump becomes 1 (even from Edit tab)', () => {
    const { rerender } = renderPanel(mockAgent, { history: [doneEntry] })

    // Navigate to Edit tab
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()

    rerender(
      <AgentPanel
        agentDef={mockAgent}
        history={[doneEntry]}
        historyBump={1}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    // After bump → Chat tab should be active (shows history + input)
    expect(screen.queryByTestId('edit-name-input')).toBeNull()
    expect(screen.getByTestId('history-list')).toBeInTheDocument()
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('returns to Chat tab on each subsequent bump', () => {
    const { rerender } = renderPanel(mockAgent, { history: [doneEntry] })

    // Navigate away to Edit tab
    fireEvent.click(screen.getByTestId('tab-edit'))
    expect(screen.getByTestId('edit-name-input')).toBeInTheDocument()

    // Bump → should switch back to Chat
    rerender(
      <AgentPanel
        agentDef={mockAgent}
        history={[doneEntry]}
        historyBump={2}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
        onClearHistory={vi.fn()}
      />,
    )

    expect(screen.queryByTestId('edit-name-input')).toBeNull()
    expect(screen.getByTestId('history-list')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Task input is cleared after submission
// ---------------------------------------------------------------------------

describe('AgentPanel task input cleared after submit', () => {
  it('clears the task input after send button is clicked', () => {
    renderPanel()
    const input = screen.getByTestId('run-task-input') as HTMLTextAreaElement

    fireEvent.change(input, { target: { value: 'Do something' } })
    expect(input.value).toBe('Do something')

    fireEvent.click(screen.getByTestId('run-submit-btn'))

    expect(input.value).toBe('')
  })

  it('does not call onRunTask or clear input when task is empty', () => {
    const { onRunTask } = renderPanel()
    const input = screen.getByTestId('run-task-input') as HTMLTextAreaElement

    fireEvent.click(screen.getByTestId('run-submit-btn'))

    expect(onRunTask).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })
})

// ---------------------------------------------------------------------------
// State reset on agent change
// ---------------------------------------------------------------------------

describe('AgentPanel state reset', () => {
  it('resets to Chat mode when a new agent is shown', () => {
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
        history={[]}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
        onClearHistory={vi.fn()}
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
        history={[]}
        onClose={vi.fn()}
        onRunTask={vi.fn()}
        onEditSave={vi.fn()}
        onClearHistory={vi.fn()}
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
