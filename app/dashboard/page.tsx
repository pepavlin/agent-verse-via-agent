'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/agents')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-gray-600">Redirecting...</div>
    </div>
  )
}
