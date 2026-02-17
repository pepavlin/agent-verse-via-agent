'use client'

import { useState } from 'react'
import Link from 'next/link'

interface DepartmentInfo {
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

interface DepartmentCardProps {
  department: DepartmentInfo
  availableAgents?: {
    id: string
    name: string
    role: string
  }[]
  missingRoles?: string[]
}

export default function DepartmentCard({ department, availableAgents = [], missingRoles = [] }: DepartmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isReady = missingRoles.length === 0

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      researcher: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
      strategist: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200',
      critic: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
      ideator: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
      coordinator: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200',
      executor: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200'
    }
    return colors[role] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300'
  }

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      researcher: '🔍',
      strategist: '🎯',
      critic: '⚖️',
      ideator: '💡',
      coordinator: '🔗',
      executor: '⚡'
    }
    return icons[role] || '🤖'
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              {department.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
              {department.description}
            </p>
          </div>
          <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
            isReady ? 'bg-success/10 dark:bg-success/20 text-success-dark dark:text-success-light' : 'bg-warning/10 dark:bg-warning/20 text-warning-dark dark:text-warning-light'
          }`}>
            {isReady ? '✓ Ready' : '⚠ Setup Required'}
          </div>
        </div>

        {/* Required Roles */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Required Agent Roles:</h4>
          <div className="flex flex-wrap gap-2">
            {department.requiredRoles.map((role) => {
              const hasRole = availableAgents.some(a => a.role === role)
              return (
                <span
                  key={role}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    hasRole ? getRoleColor(role) : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-300 line-through'
                  }`}
                >
                  {getRoleIcon(role)} {role}
                  {hasRole && <span className="text-success ml-1">✓</span>}
                </span>
              )
            })}
          </div>
        </div>

        {/* Missing Roles Warning */}
        {missingRoles.length > 0 && (
          <div className="mb-4 p-3 bg-warning/10 dark:bg-warning/20 border border-warning/30 dark:border-warning/50 rounded-md">
            <p className="text-xs text-warning-dark dark:text-warning-light">
              <strong>Missing agents:</strong> You need to create agents with roles: {missingRoles.join(', ')}
            </p>
          </div>
        )}

        {/* Capabilities */}
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-primary hover:text-primary-dark dark:hover:text-primary-light flex items-center gap-1"
          >
            {isExpanded ? '▼' : '▶'} View Capabilities & Workflow
          </button>
        </div>

        {isExpanded && (
          <div className="mb-4 space-y-4 border-t border-neutral-200 dark:border-neutral-700 pt-4">
            {/* Capabilities List */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Capabilities:</h4>
              <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                {department.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Workflow Steps */}
            <div>
              <h4 className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">Workflow Steps:</h4>
              <div className="space-y-2">
                {department.workflowSteps.map((step) => (
                  <div key={step.step} className="flex items-start gap-3 text-xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary-dark dark:text-primary-light flex items-center justify-center font-medium">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mb-1 ${getRoleColor(step.role)}`}>
                        {getRoleIcon(step.role)} {step.role}
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">
          {isReady ? (
            <Link
              href={`/departments/${department.id}`}
              className="w-full inline-block text-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors text-sm font-medium"
            >
              Run {department.name}
            </Link>
          ) : (
            <Link
              href="/agents"
              className="w-full inline-block text-center px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
            >
              Create Missing Agents
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
