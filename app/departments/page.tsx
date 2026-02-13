'use client'

import { useEffect, useState } from 'react'
import { simpleAuth } from '@/lib/simple-auth'
import { useRouter } from 'next/navigation'
import DepartmentCard from '../components/DepartmentCard'
import Link from 'next/link'

interface Department {
  id: string
  name: string
  description: string
  requiredRoles: string[]
  endpoint: string
  capabilities: string[]
  workflowSteps: {
    step: number
    role: string
    description: string
  }[]
}

interface Agent {
  id: string
  name: string
  role: string
}

export default function DepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const user = simpleAuth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      fetchDepartments()
      fetchAgents()
    }
  }, [router])

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (!response.ok) {
        throw new Error('Failed to fetch departments')
      }
      const data = await response.json()
      setDepartments(data.departments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments')
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
      }
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (err) {
      console.error('Failed to load agents:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDepartmentStatus = (department: Department) => {
    const availableRoles = new Set(agents.map(a => a.role))
    const missingRoles = department.requiredRoles.filter(role => !availableRoles.has(role))
    const availableAgents = agents.filter(a => department.requiredRoles.includes(a.role))

    return {
      availableAgents,
      missingRoles
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-purple-300">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
              <p className="mt-2 text-gray-600">
                Multi-agent collaboration workflows for complex tasks
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/agents"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Manage Agents
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-1">What are Departments?</h3>
          <p className="text-sm text-blue-800">
            Departments are pre-configured multi-agent workflows that coordinate multiple AI agents to
            tackle complex tasks. Each department requires specific agent roles and follows a structured
            workflow to deliver comprehensive results.
          </p>
        </div>

        {/* Departments Grid */}
        {departments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {departments.map((department) => {
              const status = getDepartmentStatus(department)
              return (
                <DepartmentCard
                  key={department.id}
                  department={department}
                  availableAgents={status.availableAgents}
                  missingRoles={status.missingRoles}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No departments available</p>
          </div>
        )}

        {/* Getting Started Guide */}
        {agents.length === 0 && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
            <p className="text-gray-600 mb-4">
              To use departments, you need to create agents with specific roles. Here's how:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Go to the <Link href="/agents" className="text-blue-600 hover:underline">Agents page</Link></li>
              <li>Create agents with the required roles (researcher, strategist, critic, ideator)</li>
              <li>Return here to run department workflows</li>
            </ol>
            <div className="mt-6">
              <Link
                href="/agents"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Create Your First Agent
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
