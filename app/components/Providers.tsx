'use client'

import GlobalChat from './GlobalChat'
import ThemeProvider from './ThemeProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <GlobalChat />
    </ThemeProvider>
  )
}
