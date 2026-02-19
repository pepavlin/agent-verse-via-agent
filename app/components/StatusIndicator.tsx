'use client'

interface StatusIndicatorProps {
  status: 'idle' | 'thinking' | 'communicating' | 'error'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const statusConfig = {
  idle: {
    color: 'bg-gray-400 dark:bg-gray-500',
    label: 'Idle',
    icon: '⏸️',
    pulse: false
  },
  thinking: {
    color: 'bg-blue-500 dark:bg-blue-400',
    label: 'Thinking',
    icon: '🤔',
    pulse: true
  },
  communicating: {
    color: 'bg-green-500 dark:bg-green-400',
    label: 'Communicating',
    icon: '💬',
    pulse: true
  },
  error: {
    color: 'bg-red-500 dark:bg-red-400',
    label: 'Error',
    icon: '⚠️',
    pulse: false
  }
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
}

export default function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false 
}: StatusIndicatorProps) {
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
        {config.pulse && (
          <div
            className={`absolute inset-0 ${config.color} rounded-full animate-ping opacity-75`}
          />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {config.icon} {config.label}
        </span>
      )}
    </div>
  )
}
