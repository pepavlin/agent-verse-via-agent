'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Agent {
  id: string
  name: string
  description: string | null
  model: string
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface AgentChatDialogProps {
  agent: Agent
  onClose: () => void
}

export default function AgentChatDialog({ agent, onClose }: AgentChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadChatHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/agents/${agent.id}/messages`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = data.map((msg: Record<string, unknown>) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.createdAt as string)
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [agent.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    loadChatHistory()
  }, [agent.id, loadChatHistory])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`/api/agents/${agent.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: data.id,
          content: data.content,
          role: 'assistant',
          timestamp: new Date(data.createdAt)
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Fallback mock response if API fails
        const mockResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: `Hello! I'm ${agent.name}. How can I help you today?`,
          role: 'assistant',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, mockResponse])
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Mock response on error
      const mockResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Hello! I'm ${agent.name}. I'm experiencing some technical difficulties, but I'm here to help!`,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, mockResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl border border-neutral-200 dark:border-primary/30 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{agent.name}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Model: {agent.model}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900/50">
          {messages.length === 0 ? (
            <div className="text-center text-neutral-500 dark:text-neutral-400 mt-8">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light border border-neutral-300 dark:border-neutral-600 transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-primary hover:bg-primary-dark disabled:bg-neutral-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed text-white rounded-lg px-6 py-2 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
