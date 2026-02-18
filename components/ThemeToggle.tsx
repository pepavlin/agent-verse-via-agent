'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    // Using setTimeout to avoid the cascading render warning
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    // Return a placeholder to avoid hydration mismatch
    return (
      <div className="w-9 h-9 rounded-md bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
    )
  }

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            p-1.5 rounded-md transition-all
            ${
              theme === value
                ? 'bg-white dark:bg-neutral-700 text-primary shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }
          `}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  )
}
