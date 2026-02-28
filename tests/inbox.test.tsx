import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { useInbox } from '../app/components/use-inbox'
import type { InboxMessage } from '../app/components/use-inbox'
import { InboxToggleButton, InboxPanel } from '../app/components/Inbox'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const doneMessage: InboxMessage = {
  id: 'run-1',
  type: 'done',
  agentName: 'Alice',
  agentColor: 0xff6b6b,
  task: 'Explore the northern sector',
  text: 'Alice has successfully mapped the northern sector.',
}

const questionMessage: InboxMessage = {
  id: 'run-2',
  type: 'question',
  agentName: 'Bob',
  agentColor: 0x4ecdc4,
  task: 'Build a fortification',
  text: 'Zpracovávám úkol…',
}

const awaitingAnswerMessage: InboxMessage = {
  id: 'run-4',
  type: 'question',
  agentName: 'Dave',
  agentColor: 0x9b59b6,
  task: 'Defend the perimeter',
  text: 'Dave needs clarification: What priority level should this task have?',
  awaitingAnswer: true,
}

const errorMessage: InboxMessage = {
  id: 'run-3',
  type: 'error',
  agentName: 'Carol',
  agentColor: 0xffe66d,
  task: 'Scout the eastern border',
  text: 'Nastala chyba.',
}

// ---------------------------------------------------------------------------
// useInbox hook tests
// ---------------------------------------------------------------------------

describe('useInbox', () => {
  it('starts with empty messages and zero unread', () => {
    const { result } = renderHook(() => useInbox())
    expect(result.current.messages).toEqual([])
    expect(result.current.unreadCount).toBe(0)
  })

  it('addMessage prepends to the feed and bumps unread count', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]).toEqual(doneMessage)
    expect(result.current.unreadCount).toBe(1)
  })

  it('addMessage prepends newest message to front of list', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
      result.current.addMessage(questionMessage)
    })

    // Most recently added should be first
    expect(result.current.messages[0].id).toBe('run-2')
    expect(result.current.messages[1].id).toBe('run-1')
  })

  it('updateMessage changes fields on the matching message', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(questionMessage)
    })

    act(() => {
      result.current.updateMessage('run-2', { type: 'done', text: 'Task complete.' })
    })

    const updated = result.current.messages.find((m) => m.id === 'run-2')!
    expect(updated.type).toBe('done')
    expect(updated.text).toBe('Task complete.')
    // Other fields unchanged
    expect(updated.agentName).toBe('Bob')
    expect(updated.task).toBe('Build a fortification')
  })

  it('updateMessage to done bumps unread count', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(questionMessage)
    })

    const unreadAfterAdd = result.current.unreadCount

    act(() => {
      result.current.updateMessage('run-2', { type: 'done', text: 'Done.' })
    })

    expect(result.current.unreadCount).toBeGreaterThan(unreadAfterAdd)
  })

  it('updateMessage to error bumps unread count', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(questionMessage)
    })

    const unreadAfterAdd = result.current.unreadCount

    act(() => {
      result.current.updateMessage('run-2', { type: 'error', text: 'Failed.' })
    })

    expect(result.current.unreadCount).toBeGreaterThan(unreadAfterAdd)
  })

  it('updateMessage to question does not bump unread count', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(questionMessage)
    })

    act(() => {
      result.current.markRead()
    })

    const unreadBeforeUpdate = result.current.unreadCount

    act(() => {
      result.current.updateMessage('run-2', { text: 'Still working…' })
    })

    expect(result.current.unreadCount).toBe(unreadBeforeUpdate)
  })

  it('updateMessage on non-existent id is a no-op', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
    })

    act(() => {
      result.current.updateMessage('nonexistent', { type: 'error' })
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].type).toBe('done')
  })

  it('dismissMessage removes the message by id', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
      result.current.addMessage(questionMessage)
    })

    act(() => {
      result.current.dismissMessage('run-1')
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].id).toBe('run-2')
  })

  it('dismissMessage on non-existent id leaves messages unchanged', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
    })

    act(() => {
      result.current.dismissMessage('nonexistent')
    })

    expect(result.current.messages).toHaveLength(1)
  })

  it('clearAll removes all messages', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
      result.current.addMessage(questionMessage)
      result.current.addMessage(errorMessage)
    })

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.messages).toHaveLength(0)
  })

  it('markRead resets unread count to zero', () => {
    const { result } = renderHook(() => useInbox())

    act(() => {
      result.current.addMessage(doneMessage)
      result.current.addMessage(questionMessage)
    })

    expect(result.current.unreadCount).toBe(2)

    act(() => {
      result.current.markRead()
    })

    expect(result.current.unreadCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// InboxToggleButton tests
// ---------------------------------------------------------------------------

describe('InboxToggleButton', () => {
  it('renders the Inbox label', () => {
    render(
      <InboxToggleButton unreadCount={0} isOpen={false} onClick={vi.fn()} />,
    )
    expect(screen.getByTestId('inbox-toggle-btn')).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument()
  })

  it('does not render unread badge when count is zero', () => {
    render(
      <InboxToggleButton unreadCount={0} isOpen={false} onClick={vi.fn()} />,
    )
    expect(screen.queryByTestId('inbox-unread-badge')).toBeNull()
  })

  it('renders unread badge with correct count', () => {
    render(
      <InboxToggleButton unreadCount={5} isOpen={false} onClick={vi.fn()} />,
    )
    const badge = screen.getByTestId('inbox-unread-badge')
    expect(badge).toBeInTheDocument()
    expect(badge.textContent).toBe('5')
  })

  it('caps badge at 99+ for large counts', () => {
    render(
      <InboxToggleButton unreadCount={150} isOpen={false} onClick={vi.fn()} />,
    )
    const badge = screen.getByTestId('inbox-unread-badge')
    expect(badge.textContent).toBe('99+')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(
      <InboxToggleButton unreadCount={0} isOpen={false} onClick={onClick} />,
    )
    fireEvent.click(screen.getByTestId('inbox-toggle-btn'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})

// ---------------------------------------------------------------------------
// InboxPanel tests
// ---------------------------------------------------------------------------

describe('InboxPanel', () => {
  const defaultProps = {
    messages: [] as InboxMessage[],
    isOpen: true,
    onClose: vi.fn(),
    onDismiss: vi.fn(),
    onClearAll: vi.fn(),
  }

  it('renders nothing when isOpen is false', () => {
    render(<InboxPanel {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId('inbox-panel')).toBeNull()
  })

  it('renders panel when isOpen is true', () => {
    render(<InboxPanel {...defaultProps} />)
    expect(screen.getByTestId('inbox-panel')).toBeInTheDocument()
  })

  it('shows empty state when there are no messages', () => {
    render(<InboxPanel {...defaultProps} messages={[]} />)
    expect(screen.getByTestId('inbox-empty')).toBeInTheDocument()
    expect(screen.getByText('Žádné zprávy')).toBeInTheDocument()
  })

  it('renders done message with correct label', () => {
    render(<InboxPanel {...defaultProps} messages={[doneMessage]} />)
    expect(screen.getByText('Hotovo')).toBeInTheDocument()
    expect(screen.getByText(doneMessage.task)).toBeInTheDocument()
    expect(screen.getByText(doneMessage.text)).toBeInTheDocument()
    expect(screen.getByText(doneMessage.agentName)).toBeInTheDocument()
  })

  it('renders question message with correct label', () => {
    render(<InboxPanel {...defaultProps} messages={[questionMessage]} />)
    expect(screen.getByText('Otázka')).toBeInTheDocument()
    expect(screen.getByText(questionMessage.agentName)).toBeInTheDocument()
  })

  it('renders error message with correct label', () => {
    render(<InboxPanel {...defaultProps} messages={[errorMessage]} />)
    expect(screen.getByText('Chyba')).toBeInTheDocument()
    expect(screen.getByText(errorMessage.agentName)).toBeInTheDocument()
  })

  it('renders multiple messages', () => {
    const messages = [doneMessage, questionMessage, errorMessage]
    render(<InboxPanel {...defaultProps} messages={messages} />)
    expect(screen.getByTestId(`inbox-message-${doneMessage.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`inbox-message-${questionMessage.id}`)).toBeInTheDocument()
    expect(screen.getByTestId(`inbox-message-${errorMessage.id}`)).toBeInTheDocument()
  })

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <InboxPanel {...defaultProps} messages={[doneMessage]} onDismiss={onDismiss} />,
    )
    fireEvent.click(screen.getByTestId(`dismiss-${doneMessage.id}`))
    expect(onDismiss).toHaveBeenCalledWith(doneMessage.id)
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<InboxPanel {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('inbox-close-btn'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<InboxPanel {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('inbox-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows clear-all button only when there are messages', () => {
    const { rerender } = render(<InboxPanel {...defaultProps} messages={[]} />)
    expect(screen.queryByTestId('inbox-clear-all')).toBeNull()

    rerender(<InboxPanel {...defaultProps} messages={[doneMessage]} />)
    expect(screen.getByTestId('inbox-clear-all')).toBeInTheDocument()
  })

  it('calls onClearAll when clear-all is clicked', () => {
    const onClearAll = vi.fn()
    render(
      <InboxPanel {...defaultProps} messages={[doneMessage]} onClearAll={onClearAll} />,
    )
    fireEvent.click(screen.getByTestId('inbox-clear-all'))
    expect(onClearAll).toHaveBeenCalledOnce()
  })

  it('shows message count footer when messages exist', () => {
    render(<InboxPanel {...defaultProps} messages={[doneMessage]} />)
    expect(screen.getByText(/1 zpráva/)).toBeInTheDocument()
  })

  it('shows plural message count for multiple messages', () => {
    render(
      <InboxPanel {...defaultProps} messages={[doneMessage, questionMessage]} />,
    )
    expect(screen.getByText(/2 zprávy/)).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// InboxPanel — reply form (needs_user feature)
// ---------------------------------------------------------------------------

describe('InboxPanel — inline reply form', () => {
  const defaultProps = {
    messages: [] as InboxMessage[],
    isOpen: true,
    onClose: vi.fn(),
    onDismiss: vi.fn(),
    onClearAll: vi.fn(),
  }

  it('does not render reply form for question message without awaitingAnswer', () => {
    render(<InboxPanel {...defaultProps} messages={[questionMessage]} onReply={vi.fn()} />)
    expect(screen.queryByTestId(`inbox-reply-form-${questionMessage.id}`)).toBeNull()
  })

  it('does not render reply form for done messages even with awaitingAnswer flag', () => {
    const doneWithFlag: InboxMessage = { ...doneMessage, awaitingAnswer: true }
    render(<InboxPanel {...defaultProps} messages={[doneWithFlag]} onReply={vi.fn()} />)
    expect(screen.queryByTestId(`inbox-reply-form-${doneMessage.id}`)).toBeNull()
  })

  it('renders reply form for question message with awaitingAnswer: true and onReply', () => {
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={vi.fn()} />)
    expect(screen.getByTestId(`inbox-reply-form-${awaitingAnswerMessage.id}`)).toBeInTheDocument()
  })

  it('does not render reply form when onReply is not provided', () => {
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} />)
    expect(screen.queryByTestId(`inbox-reply-form-${awaitingAnswerMessage.id}`)).toBeNull()
  })

  it('reply submit button is disabled when input is empty', () => {
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={vi.fn()} />)
    const submitBtn = screen.getByTestId(`inbox-reply-submit-${awaitingAnswerMessage.id}`)
    expect(submitBtn).toBeDisabled()
  })

  it('reply submit button becomes enabled when user types an answer', () => {
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={vi.fn()} />)
    const input = screen.getByTestId(`inbox-reply-input-${awaitingAnswerMessage.id}`)
    fireEvent.change(input, { target: { value: 'High priority' } })
    const submitBtn = screen.getByTestId(`inbox-reply-submit-${awaitingAnswerMessage.id}`)
    expect(submitBtn).not.toBeDisabled()
  })

  it('calls onReply with run id and trimmed answer on submit', () => {
    const onReply = vi.fn()
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={onReply} />)
    const input = screen.getByTestId(`inbox-reply-input-${awaitingAnswerMessage.id}`)
    fireEvent.change(input, { target: { value: '  High priority  ' } })
    fireEvent.click(screen.getByTestId(`inbox-reply-submit-${awaitingAnswerMessage.id}`))
    expect(onReply).toHaveBeenCalledWith(awaitingAnswerMessage.id, 'High priority')
  })

  it('calls onReply on Enter keypress (without Shift)', () => {
    const onReply = vi.fn()
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={onReply} />)
    const input = screen.getByTestId(`inbox-reply-input-${awaitingAnswerMessage.id}`)
    fireEvent.change(input, { target: { value: 'My answer' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    expect(onReply).toHaveBeenCalledWith(awaitingAnswerMessage.id, 'My answer')
  })

  it('does not call onReply on Shift+Enter keypress', () => {
    const onReply = vi.fn()
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={onReply} />)
    const input = screen.getByTestId(`inbox-reply-input-${awaitingAnswerMessage.id}`)
    fireEvent.change(input, { target: { value: 'My answer' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(onReply).not.toHaveBeenCalled()
  })

  it('does not call onReply when answer is only whitespace', () => {
    const onReply = vi.fn()
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={onReply} />)
    const input = screen.getByTestId(`inbox-reply-input-${awaitingAnswerMessage.id}`)
    fireEvent.change(input, { target: { value: '   ' } })
    fireEvent.click(screen.getByTestId(`inbox-reply-submit-${awaitingAnswerMessage.id}`))
    expect(onReply).not.toHaveBeenCalled()
  })

  it('shows the question text in the message card', () => {
    render(<InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={vi.fn()} />)
    expect(screen.getByText(awaitingAnswerMessage.text)).toBeInTheDocument()
  })

  it('awaitingAnswer message can still be dismissed', () => {
    const onDismiss = vi.fn()
    render(
      <InboxPanel {...defaultProps} messages={[awaitingAnswerMessage]} onReply={vi.fn()} onDismiss={onDismiss} />,
    )
    fireEvent.click(screen.getByTestId(`dismiss-${awaitingAnswerMessage.id}`))
    expect(onDismiss).toHaveBeenCalledWith(awaitingAnswerMessage.id)
  })
})
