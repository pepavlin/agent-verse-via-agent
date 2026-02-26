import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '2D Grid Explorer',
  description: 'Interactive 2D grid — zoom, pan, objects',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  )
}
