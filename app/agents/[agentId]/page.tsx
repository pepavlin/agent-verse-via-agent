'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import Link from 'next/link'
import ChatMessage from '../../components/ChatMessage'

interface Message {
  id: string
  content: string
  role: string
  createdAt: Date
}

interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  role: string | null
  personality: string | null
  messages: Message[]
}

const roleDescriptions: Record<string, string> = {
  researcher: 'Thorough and analytical, excels at gathering comprehensive information',
  strategist: 'Strategic and forward-thinking, develops plans and identifies opportunities',
  critic: 'Discerning and quality-focused, provides constructive feedback',
  ideator: 'Creative and innovative, generates novel ideas and explores possibilities'
}

const roleIcons: Record<string, string> = {
  researcher: '🔍',
  strategist: '🎯',
  critic: '⚖️',
  ideator: '💡'
}

export default function AgentChatPage() {
  const router = useRouter()
  const params = useParams()
  const agentId = params?.agentId as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const user = simpleAuth.getUser()
    if (!user) {
      router.push('/login')
    } else if (agentId) {
      fetchAgent()
    }
  }, [router, agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      if (response.ok) {
        const data = await response.json()
        setAgent(data)
        setMessages(data.messages)
      } else {
        router.push('/game')
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error)
      router.push('/game')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setSending(true)

    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      content: userMessage,
      role: 'user',
      createdAt: new Date()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId,
          message: userMessage
        }),
      })

      if (response.ok) {
        const data = await response.json()

        setMessages(prev => [
          ...prev.filter(m => m.id !== tempUserMessage.id),
          {
            id: `user-${Date.now()}`,
            content: userMessage,
            role: 'user',
            createdAt: new Date()
          },
          data.message
        ])
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id))
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-lg text-purple-300">Loading...</div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-lg text-purple-300">Agent not found</div>
      </div>
    )
  }

  const roleIcon = agent.role ? roleIcons[agent.role] || '🤖' : '🤖'
  const roleDesc = agent.role ? roleDescriptions[agent.role] : null

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <nav className="bg-gray-900/50 backdrop-blur-sm shadow-lg border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/game"
                className="text-purple-300 hover:text-purple-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-purple-100">{agent.name}</h1>
                  {agent.role && (
                    <span className="text-lg" title={roleDesc || undefined}>
                      {roleIcon}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-purple-400">
                  <span>
                    {agent.model.includes('sonnet') ? 'Claude 3.5 Sonnet' :
                     agent.model.includes('opus') ? 'Claude 3 Opus' : 'Claude 3 Haiku'}
                  </span>
                  {agent.role && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{agent.role}</span>
                    </>
                  )}
                </div>
                {roleDesc && (
                  <p className="text-xs text-purple-500 mt-1 max-w-md">
                    {roleDesc}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/30 backdrop-blur-sm rounded-lg border border-purple-500/30">
              <svg
                className="mx-auto h-12 w-12 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-purple-200">Start a conversation</h3>
              <p className="mt-1 text-sm text-purple-400">
                Send a message to begin chatting with {agent.name}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-sm border-t border-purple-500/30 px-4 py-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
