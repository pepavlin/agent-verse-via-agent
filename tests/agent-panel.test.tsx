import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AgentPanel, {
  getDateKey,
  formatDateLabel,
  groupEntriesWithSeparators,
} from '../app/components/AgentPanel'
import type { AgentDef } from '../app/components/agents-config'
import type { RunTaskPayload, EditSavePayload, WaitRunPhase } from '../app/components/AgentPanel'
import type { HistoryEntry } from '../app/components/use-agent-history'

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
    onClearHistory?: () => void
    waitPhase?: WaitRunPhase
    waitResult?: string
    waitError?: string
    history?: HistoryEntry[]
  } = {},
) {
  const onClose = overrides.onClose ?? vi.fn()
  const onRunTask = overrides.onRunTask ?? vi.fn()
  const onEditSave = overrides.onEditSave ?? vi.fn()
  const onNewTask = overrides.onNewTask ?? vi.fn()
  const onClearHistory = overrides.onClearHistory ?? vi.fn()

  const result = render(
    <AgentPanel
      agentDef={agentDef}
      onClose={onClose}
      onRunTask={onRunTask}
      onEditSave={onEditSave}
      onNewTask={onNewTask}
      onClearHistory={onClearHistory}
      waitPhase={overrides.waitPhase}
      waitResult={overrides.waitResult}
      waitError={overrides.waitError}
      history={overrides.history}
    />,
  )

  return { onClose, onRunTask, onEditSave, onNewTask, onClearHistory, ...result }
}

// ---------------------------------------------------------------------------
// History entry fixture helper
// ---------------------------------------------------------------------------

function makeHistoryEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: `hist-${Math.random().toString(36).slice(2)}`,
    agentId: 'agent-test',
    task: 'Explore the northern sector',
    type: 'done',
    result: 'Northern sector fully mapped.',
    timestamp: Date.now(),
    ...overrides,
  }
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

// ---------------------------------------------------------------------------
// Log tab — agent history in chat style
// ---------------------------------------------------------------------------

describe('AgentPanel Log tab', () => {
  it('shows the Log tab button', () => {
    renderPanel()
    expect(screen.getByTestId('tab-log')).toBeInTheDocument()
  })

  it('switches to Log mode when Log tab is clicked', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.queryByTestId('run-task-input')).toBeNull()
    expect(screen.queryByTestId('edit-name-input')).toBeNull()
  })

  it('shows empty state message when history is empty', () => {
    renderPanel(mockAgent, { history: [] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId('agent-history-empty')).toBeInTheDocument()
  })

  it('shows empty state when history prop is omitted', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId('agent-history-empty')).toBeInTheDocument()
  })

  it('shows the history view when entries are present', () => {
    const entry = makeHistoryEntry()
    renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId('agent-history-view')).toBeInTheDocument()
    expect(screen.queryByTestId('agent-history-empty')).toBeNull()
  })

  it('renders task bubble for each history entry', () => {
    const entry = makeHistoryEntry({ task: 'Explore the western caves' })
    renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId(`history-task-${entry.id}`)).toHaveTextContent('Explore the western caves')
  })

  it('renders result bubble for each history entry', () => {
    const entry = makeHistoryEntry({ result: 'Western caves fully mapped.' })
    renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId(`history-result-${entry.id}`)).toHaveTextContent('Western caves fully mapped.')
  })

  it('shows "Hotovo" label for done entries', () => {
    const entry = makeHistoryEntry({ type: 'done' })
    renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId(`history-entry-${entry.id}`)).toHaveTextContent('Hotovo')
  })

  it('shows "Otázka" label for question entries', () => {
    const entry = makeHistoryEntry({ type: 'question', result: 'What is the priority?' })
    renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId(`history-entry-${entry.id}`)).toHaveTextContent('Otázka')
  })

  it('shows "Chyba" label for error entries', () => {
    const entry = makeHistoryEntry({ type: 'error', result: 'Network timeout.' })
    renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    expect(screen.getByTestId(`history-entry-${entry.id}`)).toHaveTextContent('Chyba')
  })

  it('shows multiple history entries', () => {
    const entries = [
      makeHistoryEntry({ task: 'Task one', result: 'Done one.' }),
      makeHistoryEntry({ task: 'Task two', result: 'Done two.', type: 'error' }),
    ]
    renderPanel(mockAgent, { history: entries })
    fireEvent.click(screen.getByTestId('tab-log'))
    // Both entries rendered (list may also contain date separators)
    expect(screen.getAllByTestId(/^history-entry-/).length).toBe(2)
  })

  it('calls onClearHistory when clear button is clicked', () => {
    const entry = makeHistoryEntry()
    const { onClearHistory } = renderPanel(mockAgent, { history: [entry] })
    fireEvent.click(screen.getByTestId('tab-log'))
    fireEvent.click(screen.getByTestId('agent-history-clear-btn'))
    expect(onClearHistory).toHaveBeenCalledOnce()
  })

  it('shows entry count in the tab label when history is non-empty', () => {
    const entries = [makeHistoryEntry(), makeHistoryEntry()]
    renderPanel(mockAgent, { history: entries })
    expect(screen.getByTestId('tab-log')).toHaveTextContent('Log (2)')
  })

  it('does not show entry count in the tab label when history is empty', () => {
    renderPanel(mockAgent, { history: [] })
    expect(screen.getByTestId('tab-log')).toHaveTextContent('Log')
    expect(screen.getByTestId('tab-log')).not.toHaveTextContent('(')
  })

  it('can switch back to Run mode from Log mode', () => {
    renderPanel()
    fireEvent.click(screen.getByTestId('tab-log'))
    fireEvent.click(screen.getByTestId('tab-run'))
    expect(screen.getByTestId('run-task-input')).toBeInTheDocument()
  })

  it('renders date separator between entries from different days', () => {
    // Timestamps 2 days apart ensure two distinct date groups
    const dayMs = 24 * 60 * 60 * 1000
    const yesterday = Date.now() - dayMs
    const entries = [
      makeHistoryEntry({ timestamp: yesterday, task: 'Old task' }),
      makeHistoryEntry({ timestamp: Date.now(), task: 'New task' }),
    ]
    renderPanel(mockAgent, { history: entries })
    fireEvent.click(screen.getByTestId('tab-log'))

    // Expect two separators (yesterday + today) for two different days
    const yesterdayKey = getDateKey(yesterday)
    const todayKey = getDateKey(Date.now())
    expect(screen.getByTestId(`history-date-separator-sep-${yesterdayKey}`)).toBeInTheDocument()
    expect(screen.getByTestId(`history-date-separator-sep-${todayKey}`)).toBeInTheDocument()
  })

  it('does not render a date separator between same-day entries', () => {
    const now = Date.now()
    // Both entries share the same timestamp (same day)
    const entries = [
      makeHistoryEntry({ timestamp: now, task: 'Morning task' }),
      makeHistoryEntry({ timestamp: now + 1000, task: 'Afternoon task' }),
    ]
    renderPanel(mockAgent, { history: entries })
    fireEvent.click(screen.getByTestId('tab-log'))

    // Only one separator (for today) should appear
    const todayKey = getDateKey(now)
    expect(screen.getByTestId(`history-date-separator-sep-${todayKey}`)).toBeInTheDocument()
    // There should be exactly one separator element
    const separators = screen.queryAllByTestId(/^history-date-separator-/)
    expect(separators).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Date utility functions — unit tests
// ---------------------------------------------------------------------------

describe('getDateKey', () => {
  it('returns YYYY-MM-DD string from a Unix ms timestamp', () => {
    // 2024-03-15T12:00:00Z
    const ts = new Date('2024-03-15T12:00:00Z').getTime()
    const key = getDateKey(ts)
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns the same key for two timestamps on the same day', () => {
    const morning = new Date('2024-03-15T08:00:00').getTime()
    const evening = new Date('2024-03-15T22:00:00').getTime()
    expect(getDateKey(morning)).toBe(getDateKey(evening))
  })

  it('returns different keys for consecutive days', () => {
    const today = new Date('2024-03-15T12:00:00').getTime()
    const tomorrow = new Date('2024-03-16T12:00:00').getTime()
    expect(getDateKey(today)).not.toBe(getDateKey(tomorrow))
  })
})

describe('formatDateLabel', () => {
  it('returns "Dnes" for today\'s date key', () => {
    const todayKey = getDateKey(Date.now())
    expect(formatDateLabel(todayKey)).toBe('Dnes')
  })

  it('returns "Včera" for yesterday\'s date key', () => {
    const yesterdayKey = getDateKey(Date.now() - 24 * 60 * 60 * 1000)
    expect(formatDateLabel(yesterdayKey)).toBe('Včera')
  })

  it('returns a non-empty string for older dates', () => {
    const oldDateKey = '2023-01-15'
    const label = formatDateLabel(oldDateKey)
    expect(label).toBeTruthy()
    expect(label).not.toBe('Dnes')
    expect(label).not.toBe('Včera')
  })
})

describe('groupEntriesWithSeparators', () => {
  const makeEntry = (ts: number, id: string): HistoryEntry => ({
    id,
    agentId: 'agent-test',
    task: 'Some task',
    type: 'done',
    result: 'Done.',
    timestamp: ts,
  })

  it('returns empty array for empty input', () => {
    expect(groupEntriesWithSeparators([])).toEqual([])
  })

  it('inserts a single separator before a single entry', () => {
    const entry = makeEntry(Date.now(), 'e1')
    const result = groupEntriesWithSeparators([entry])
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ _type: 'date-separator' })
    expect(result[1]).toBe(entry)
  })

  it('inserts one separator for same-day entries', () => {
    const now = Date.now()
    const e1 = makeEntry(now, 'e1')
    const e2 = makeEntry(now + 1000, 'e2')
    const result = groupEntriesWithSeparators([e1, e2])
    // [separator, e1, e2]
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ _type: 'date-separator' })
    expect(result[1]).toBe(e1)
    expect(result[2]).toBe(e2)
  })

  it('inserts two separators for entries on different days', () => {
    const dayMs = 24 * 60 * 60 * 1000
    const yesterday = Date.now() - dayMs
    const e1 = makeEntry(yesterday, 'e1')
    const e2 = makeEntry(Date.now(), 'e2')
    const result = groupEntriesWithSeparators([e1, e2])
    // [sep-yesterday, e1, sep-today, e2]
    expect(result).toHaveLength(4)
    expect(result[0]).toMatchObject({ _type: 'date-separator' })
    expect(result[1]).toBe(e1)
    expect(result[2]).toMatchObject({ _type: 'date-separator' })
    expect(result[3]).toBe(e2)
  })

  it('preserves original entry order', () => {
    const now = Date.now()
    const entries = [
      makeEntry(now, 'a'),
      makeEntry(now + 1000, 'b'),
      makeEntry(now + 2000, 'c'),
    ]
    const result = groupEntriesWithSeparators(entries)
    const entryItems = result.filter((item) => !('_type' in item))
    expect(entryItems).toEqual(entries)
  })

  it('separator label is "Dnes" for today\'s entries', () => {
    const e1 = makeEntry(Date.now(), 'e1')
    const result = groupEntriesWithSeparators([e1])
    const sep = result[0] as { _type: string; label: string }
    expect(sep.label).toBe('Dnes')
  })
})
