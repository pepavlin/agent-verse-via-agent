'use client'

interface AgentStatusIndicatorProps {
  status: 'idle' | 'thinking' | 'communicating' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function AgentStatusIndicator({
  status,
  size = 'md',
  showLabel = true
}: AgentStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      color: 'bg-green-500',
      label: 'Idle',
      pulse: false
    },
    thinking: {
      color: 'bg-blue-500',
      label: 'Thinking',
      pulse: true
    },
    communicating: {
      color: 'bg-yellow-500',
      label: 'Communicating',
      pulse: true
    },
    error: {
      color: 'bg-red-500',
      label: 'Error',
      pulse: false
    }
  }

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const config = statusConfig[status]
  const sizeClass = sizeClasses[size]

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClass} ${config.color} rounded-full ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        />
      </div>
      {showLabel && (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {config.label}
        </span>
      )}
    </div>
  )
}
