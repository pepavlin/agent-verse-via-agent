import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommunicationLogPanel from '@/app/components/CommunicationLogPanel'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('CommunicationLogPanel Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should render the communication log panel', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    render(<CommunicationLogPanel onClose={mockOnClose} />)

    expect(screen.getByText('Agent Communications')).toBeTruthy()
    expect(screen.getByText('0 events')).toBeTruthy()
    expect(screen.getByPlaceholderText('Search messages...')).toBeTruthy()
  })

  it('should fetch and display communication events', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        type: 'message',
        fromAgentId: 'agent-1',
        fromAgentName: 'Agent One',
        toAgentId: 'agent-2',
        toAgentName: 'Agent Two',
        content: 'Test message content',
        timestamp: new Date().toISOString(),
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockEvents,
    })

    render(<CommunicationLogPanel onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('1 event')).toBeTruthy()
    })

    expect(screen.getByText('Agent One')).toBeTruthy()
    expect(screen.getByText('Agent Two')).toBeTruthy()
    expect(screen.getByText('Test message content')).toBeTruthy()
  })

  it('should filter events by search term', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        type: 'message',
        fromAgentId: 'agent-1',
        fromAgentName: 'Research Agent',
        toAgentId: 'agent-2',
        toAgentName: 'Strategy Agent',
        content: 'Research findings about healthcare',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'event-2',
        type: 'message',
        fromAgentId: 'agent-2',
        fromAgentName: 'Strategy Agent',
        toAgentId: 'agent-3',
        toAgentName: 'Development Agent',
        content: 'Development plan for new feature',
        timestamp: new Date().toISOString(),
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockEvents,
    })

    render(<CommunicationLogPanel onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('2 events')).toBeTruthy()
    })

    const searchInput = screen.getByPlaceholderText('Search messages...')
    await userEvent.type(searchInput, 'healthcare')

    await waitFor(() => {
      expect(screen.getByText('1 event')).toBeTruthy()
    })

    expect(screen.getByText('Research findings about healthcare')).toBeTruthy()
  })
})
