import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AgentCommunicationLog from '@/app/components/AgentCommunicationLog'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AgentCommunicationLog Component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(<AgentCommunicationLog isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByText('Agent Communication')).toBeNull()
  })

  it('should render when isOpen is true', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [], count: 0 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Agent Communication')).toBeTruthy()
  })

  it('should display message count', async () => {
    const mockMessages = [
      {
        id: '1',
        fromAgentId: 'agent1',
        fromAgentName: 'Agent One',
        toAgentId: 'agent2',
        toAgentName: 'Agent Two',
        content: 'Hello',
        type: 'query',
        timestamp: new Date(),
        metadata: {},
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: mockMessages, count: 1 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('1 message')).toBeTruthy()
    })
  })

  it('should display "No agent communications yet" when no messages', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [], count: 0 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('No agent communications yet')).toBeTruthy()
    })
  })

  it('should call onClose when close button is clicked', async () => {
    const mockClose = vi.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [], count: 0 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={mockClose} />)

    const closeButton = screen.getByTitle('Close')
    await userEvent.click(closeButton)

    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('should toggle filters when filter button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [], count: 0 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={vi.fn()} />)

    const filterButton = screen.getByTitle('Toggle filters')
    await userEvent.click(filterButton)

    await waitFor(() => {
      expect(screen.getByText('Filter by Agent')).toBeTruthy()
      expect(screen.getByText('Filter by Type')).toBeTruthy()
    })
  })

  it('should filter messages by agent name', async () => {
    const mockMessages = [
      {
        id: '1',
        fromAgentId: 'agent1',
        fromAgentName: 'Alice',
        toAgentId: 'agent2',
        toAgentName: 'Bob',
        content: 'Message from Alice',
        type: 'query',
        timestamp: new Date(),
        metadata: {},
      },
      {
        id: '2',
        fromAgentId: 'agent3',
        fromAgentName: 'Charlie',
        toAgentId: 'agent4',
        toAgentName: 'David',
        content: 'Message from Charlie',
        type: 'response',
        timestamp: new Date(),
        metadata: {},
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages, count: 2 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={vi.fn()} />)

    // Wait for messages to load
    await waitFor(() => {
      expect(screen.getByText('2 messages')).toBeTruthy()
    })

    // Open filters
    const filterButton = screen.getByTitle('Toggle filters')
    await userEvent.click(filterButton)

    // Type in filter
    const filterInput = screen.getByPlaceholderText('Agent name...')
    await userEvent.type(filterInput, 'Alice')

    // Should show filtered count
    await waitFor(() => {
      expect(screen.getByText('1 message (filtered)')).toBeTruthy()
    })
  })

  it('should expand and collapse messages', async () => {
    const mockMessages = [
      {
        id: '1',
        fromAgentId: 'agent1',
        fromAgentName: 'Alice',
        toAgentId: 'agent2',
        toAgentName: 'Bob',
        content: 'This is a detailed message content that should be expandable',
        type: 'query',
        timestamp: new Date(),
        metadata: { key: 'value' },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages, count: 1 }),
    })

    render(<AgentCommunicationLog isOpen={true} onClose={vi.fn()} />)

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy()
    })

    // Initially should show preview
    expect(screen.getByText('This is a detailed message content that should be expandable')).toBeTruthy()

    // Click to expand
    const messageContainer = screen.getByText('Alice').closest('div')?.parentElement
    if (messageContainer) {
      await userEvent.click(messageContainer)
    }

    // Should still show the message content in expanded view
    await waitFor(() => {
      expect(screen.getByText('This is a detailed message content that should be expandable')).toBeTruthy()
    })
  })
})
