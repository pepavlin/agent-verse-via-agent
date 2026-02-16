'use client'

import { useState } from 'react'

interface CreateAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type AgentRole = 'researcher' | 'strategist' | 'critic' | 'ideator'

const roleDescriptions = {
  researcher: 'Thorough and analytical, excels at gathering comprehensive information and verifying facts',
  strategist: 'Strategic and forward-thinking, develops plans and identifies opportunities',
  critic: 'Discerning and quality-focused, provides constructive feedback and evaluates proposals',
  ideator: 'Creative and innovative, generates novel ideas and explores possibilities'
}

const agentColors = [
  { name: 'Indigo', value: '#3730a3' },
  { name: 'Violet', value: '#5b21b6' },
  { name: 'Cyan', value: '#0369a1' },
  { name: 'Green', value: '#027a48' },
  { name: 'Orange', value: '#b45309' },
  { name: 'Red', value: '#b91c1c' },
  { name: 'Pink', value: '#be185d' },
  { name: 'Blue', value: '#1e40af' },
]

const agentSizes = [
  { name: 'Small', value: 15 },
  { name: 'Medium', value: 20 },
  { name: 'Large', value: 25 },
  { name: 'Extra Large', value: 30 },
]

export default function CreateAgentModal({ isOpen, onClose, onSuccess }: CreateAgentModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('claude-3-5-sonnet-20241022')
  const [role, setRole] = useState<AgentRole>('researcher')
  const [color, setColor] = useState('#3730a3')
  const [size, setSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, model, role, color, size }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create agent')
      }

      setName('')
      setDescription('')
      setModel('claude-3-5-sonnet-20241022')
      setRole('researcher')
      setColor('#3730a3')
      setSize(20)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-neutral-900 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Create New Agent</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Agent Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 dark:bg-neutral-800 bg-white transition-colors"
              placeholder="My Assistant"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Agent Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as AgentRole)}
              className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 dark:bg-neutral-800 bg-white transition-colors"
            >
              <option value="researcher">Researcher</option>
              <option value="strategist">Strategist</option>
              <option value="critic">Critic</option>
              <option value="ideator">Ideator</option>
            </select>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {roleDescriptions[role]}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Agent Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {agentColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-10 rounded-md border-2 transition-all ${
                    color === c.value ? 'border-primary dark:border-primary-light scale-110 shadow-lg' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Agent Size
            </label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 dark:bg-neutral-800 bg-white transition-colors"
            >
              {agentSizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.name} ({s.value}px)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 dark:bg-neutral-800 bg-white transition-colors"
              placeholder="Additional customization for this agent..."
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Claude Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 dark:bg-neutral-800 bg-white transition-colors"
            >
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
            </select>
          </div>

          {error && (
            <div className="p-3 text-sm text-danger bg-danger/10 dark:bg-danger/20 rounded-md border border-danger/30 dark:border-danger/50">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
