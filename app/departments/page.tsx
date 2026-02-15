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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-primary-light">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">Departments</h1>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                Multi-agent collaboration workflows for complex tasks
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/agents"
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Manage Agents
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 dark:bg-danger/20 border border-danger/30 dark:border-danger/50 rounded-md">
            <p className="text-danger dark:text-danger">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-primary/10 dark:bg-primary/20 border border-primary/30 dark:border-primary/50 rounded-md">
          <h3 className="text-sm font-medium text-primary-dark dark:text-primary-light mb-1">What are Departments?</h3>
          <p className="text-sm text-primary-dark dark:text-primary-light/80">
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
          <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <p className="text-neutral-600 dark:text-neutral-400">No departments available</p>
          </div>
        )}

        {/* Getting Started Guide */}
        {agents.length === 0 && (
          <div className="mt-8 p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-3">Getting Started</h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              To use departments, you need to create agents with specific roles. Here&apos;s how:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Go to the <Link href="/agents" className="text-primary hover:text-primary-dark dark:hover:text-primary-light underline">Agents page</Link></li>
              <li>Create agents with the required roles (researcher, strategist, critic, ideator)</li>
              <li>Return here to run department workflows</li>
            </ol>
            <div className="mt-6">
              <Link
                href="/agents"
                className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors font-medium"
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
