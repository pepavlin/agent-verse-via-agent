'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import ThemeToggle from '@/components/ThemeToggle'
import { useTheme } from 'next-themes'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer mounting state to avoid hydration mismatch between SSR and client
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

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
  
  // Determine if dark mode is active - only after mounting to avoid hydration mismatch
  const isDark = mounted && (theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark'))

  return (
    <div 
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{
        background: isDark 
          ? '#000000'
          : 'linear-gradient(to bottom right, rgb(79, 70, 229), rgb(147, 51, 234), rgb(8, 145, 178))'
      }}
    >
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-neutral-900 backdrop-blur-sm rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700">
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
