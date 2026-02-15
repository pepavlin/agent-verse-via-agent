import React from 'react'
import Navigation from './Navigation'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navigation />
      <main className="bg-neutral-50 dark:bg-neutral-950">{children}</main>
    </div>
  )
}
