import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommunicationLogPanel from '@/app/components/CommunicationLogPanel'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL.createObjectURL / revokeObjectURL for export tests
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('CommunicationLogPanel Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
    // Re-assign createObjectURL/revokeObjectURL after resetAllMocks
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
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

  it('should show export menu when download button is clicked', async () => {
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

    const exportButton = screen.getByTitle('Export events')
    await userEvent.click(exportButton)

    expect(screen.getByText('Export JSON')).toBeTruthy()
    expect(screen.getByText('Export CSV')).toBeTruthy()
  })

  it('should trigger JSON download on Export JSON click', async () => {
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

    // Spy on anchor click to avoid navigation
    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(clickSpy)
      }
      return el
    })

    render(<CommunicationLogPanel onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('1 event')).toBeTruthy()
    })

    await userEvent.click(screen.getByTitle('Export events'))
    await userEvent.click(screen.getByText('Export JSON'))

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    vi.restoreAllMocks()
  })

  it('should trigger CSV download on Export CSV click', async () => {
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

    const clickSpy = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') {
        vi.spyOn(el as HTMLAnchorElement, 'click').mockImplementation(clickSpy)
      }
      return el
    })

    render(<CommunicationLogPanel onClose={mockOnClose} />)

    await waitFor(() => {
      expect(screen.getByText('1 event')).toBeTruthy()
    })

    await userEvent.click(screen.getByTitle('Export events'))
    await userEvent.click(screen.getByText('Export CSV'))

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')

    vi.restoreAllMocks()
  })
})
