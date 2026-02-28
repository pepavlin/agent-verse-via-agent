import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from './components/SessionProvider'

export const metadata: Metadata = {
  title: 'Agent Verse',
  description: 'Interaktivní svět AI agentů',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
