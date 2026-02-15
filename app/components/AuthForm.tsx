'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        })

        if (!response.ok) {
          // Parse JSON error response
          const errorData = await response.json()
          throw new Error(errorData.error?.message || 'Registration failed')
        }

        await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        router.push('/dashboard')
      } else {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Invalid credentials')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: unknown) {
      // Enhanced error logging
      console.error('[AUTH_FORM_ERROR]', err)
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('[AUTH_FORM_ERROR_DETAILS]', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        mode,
        timestamp: new Date().toISOString()
      })

      setError(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700">
      <h2 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-50">
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 bg-white dark:bg-neutral-700"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 bg-white dark:bg-neutral-700"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 mt-1 border border-neutral-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-light text-neutral-900 dark:text-neutral-50 bg-white dark:bg-neutral-700"
          />
        </div>

        {error && (
          <div className="p-3 text-sm text-danger bg-danger/10 dark:bg-danger/20 rounded-md border border-danger/30 dark:border-danger/50">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-medium text-white bg-primary hover:bg-primary-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <p className="text-sm text-center text-neutral-600 dark:text-neutral-400">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-primary hover:text-primary-dark dark:hover:text-primary-light underline">
              Sign up
            </a>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:text-primary-dark dark:hover:text-primary-light underline">
              Sign in
            </a>
          </>
        )}
      </p>
    </div>
  )
}
