'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Defer mounting state to avoid hydration mismatch between SSR and client
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Watch for theme changes by observing the HTML class
  useEffect(() => {
    if (!mounted) return

    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }

    // Initial check
    updateTheme()

    // Watch for changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [mounted])

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
  
  const isDark = isDarkMode

  return (
    <>
      <style jsx>{`
        @keyframes gradient-animation {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animated-gradient {
          background: linear-gradient(
            -45deg,
            rgb(79, 70, 229),
            rgb(147, 51, 234),
            rgb(8, 145, 178),
            rgb(99, 102, 241)
          );
          background-size: 400% 400%;
          animation: gradient-animation 15s ease infinite;
        }
      `}</style>
      
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          isDark ? '' : 'animated-gradient'
        }`}
        style={{
          background: isDark ? '#000000' : undefined
        }}
      >
        {/* Theme Toggle - Fixed position */}
        <div className="fixed top-4 right-4 z-10">
          <ThemeToggle />
        </div>

      <div 
        className="w-full max-w-md p-8 space-y-6 backdrop-blur-sm rounded-lg shadow-2xl transition-colors duration-300"
        style={{
          backgroundColor: isDark ? '#171717' : '#ffffff',
          borderColor: isDark ? '#404040' : '#e5e7eb'
        }}
      >
        <h2 
          className="text-4xl font-black text-center"
          style={{
            color: isDark ? '#ffffff' : undefined,
            backgroundImage: isDark ? undefined : 'linear-gradient(to right, rgb(55, 48, 163), rgb(8, 105, 161))',
            backgroundClip: isDark ? undefined : 'text',
            WebkitBackgroundClip: isDark ? undefined : 'text',
            WebkitTextFillColor: isDark ? undefined : 'transparent'
          }}
        >
          Welcome to AgentVerse
        </h2>
        <p 
          className="text-center text-sm font-semibold"
          style={{
            color: isDark ? '#a3a3a3' : '#525252'
          }}
        >
          Enter your nickname to start using the app
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="nickname" 
              className="block text-sm font-bold mb-2"
              style={{
                color: isDark ? '#d4d4d4' : '#404040'
              }}
            >
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname..."
              className="w-full px-4 py-3 rounded-md focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: isDark ? '#262626' : '#fafafa',
                borderWidth: '1px',
                borderColor: isDark ? '#525252' : '#d4d4d4',
                color: isDark ? '#ffffff' : '#171717',
              }}
              autoFocus
            />
          </div>

          {error && (
            <div 
              className="p-3 text-sm rounded-md"
              style={{
                color: '#dc2626',
                backgroundColor: isDark ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)',
                borderWidth: '1px',
                borderColor: isDark ? 'rgba(220, 38, 38, 0.5)' : 'rgba(220, 38, 38, 0.3)'
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-3 font-bold text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            style={{
              background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(55, 48, 163))',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(55, 48, 163), rgb(55, 48, 163))'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, rgb(79, 70, 229), rgb(55, 48, 163))'
            }}
          >
            Start
          </button>
        </form>
      </div>
    </div>
    </>
  )
}
