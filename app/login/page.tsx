'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nickname.trim()) {
      setError('Please enter a nickname')
      return
    }

    simpleAuth.login(nickname)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-neutral-800 backdrop-blur-sm rounded-lg shadow-2xl border border-neutral-200 dark:border-primary/30">
        <h2 className="text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-accent">
          Welcome to AgentVerse
        </h2>
        <p className="text-center text-neutral-600 dark:text-neutral-400 text-sm">
          Enter your nickname to start using the app
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 placeholder-neutral-500 dark:placeholder-neutral-400 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-danger bg-danger/10 dark:bg-danger/20 rounded-md border border-danger/30 dark:border-danger/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-3 font-medium text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            Start
          </button>
        </form>
      </div>
    </div>
  )
}
