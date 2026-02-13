'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    simpleAuth.login(username)
    router.push('/game')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-2xl border border-purple-500/30">
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          Enter AgentVerse
        </h2>
        <p className="text-center text-gray-300 text-sm">
          Enter your username to begin your journey
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-300 bg-red-900/30 rounded-md border border-red-500/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-3 font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            Enter World
          </button>
        </form>
      </div>
    </div>
  )
}
