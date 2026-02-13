'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { simpleAuth } from '@/lib/simple-auth'
import GameCanvas from '../components/GameCanvas'

export default function GamePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ username: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const currentUser = simpleAuth.getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    simpleAuth.logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-lg text-purple-300">Loading universe...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 relative">
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-gray-900/90 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              AgentVerse
            </h1>
            <div className="h-6 w-px bg-purple-500/30" />
            <span className="text-purple-300 text-sm">
              Welcome, {user?.username}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-purple-300 rounded-md hover:bg-gray-700/80 transition-colors border border-purple-500/30"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <GameCanvas />

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-gray-900/90 to-transparent p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-8 text-sm text-purple-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
              <span>Click on agents to interact</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Drag to move camera</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Scroll to zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
