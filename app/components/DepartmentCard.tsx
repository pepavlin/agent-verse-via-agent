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
      researcher: 'bg-blue-100 text-blue-800',
      strategist: 'bg-purple-100 text-purple-800',
      critic: 'bg-orange-100 text-orange-800',
      ideator: 'bg-green-100 text-green-800',
      coordinator: 'bg-pink-100 text-pink-800',
      executor: 'bg-indigo-100 text-indigo-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {department.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {department.description}
            </p>
          </div>
          <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium ${
            isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isReady ? '✓ Ready' : '⚠ Setup Required'}
          </div>
        </div>

        {/* Required Roles */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Required Agent Roles:</h4>
          <div className="flex flex-wrap gap-2">
            {department.requiredRoles.map((role) => {
              const hasRole = availableAgents.some(a => a.role === role)
              return (
                <span
                  key={role}
                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                    hasRole ? getRoleColor(role) : 'bg-gray-100 text-gray-400 line-through'
                  }`}
                >
                  {getRoleIcon(role)} {role}
                  {hasRole && <span className="text-green-600 ml-1">✓</span>}
                </span>
              )
            })}
          </div>
        </div>

        {/* Missing Roles Warning */}
        {missingRoles.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Missing agents:</strong> You need to create agents with roles: {missingRoles.join(', ')}
            </p>
          </div>
        )}

        {/* Capabilities */}
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {isExpanded ? '▼' : '▶'} View Capabilities & Workflow
          </button>
        </div>

        {isExpanded && (
          <div className="mb-4 space-y-4 border-t pt-4">
            {/* Capabilities List */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Capabilities:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {department.capabilities.map((cap, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Workflow Steps */}
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Workflow Steps:</h4>
              <div className="space-y-2">
                {department.workflowSteps.map((step) => (
                  <div key={step.step} className="flex items-start gap-3 text-xs">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mb-1 ${getRoleColor(step.role)}`}>
                        {getRoleIcon(step.role)} {step.role}
                      </div>
                      <p className="text-gray-600">{step.description}</p>
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
              className="w-full inline-block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Run {department.name}
            </Link>
          ) : (
            <Link
              href="/agents"
              className="w-full inline-block text-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm font-medium"
            >
              Create Missing Agents
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
