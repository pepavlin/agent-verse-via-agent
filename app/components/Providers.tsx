'use client'

import GlobalChat from './GlobalChat'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GlobalChat />
    </>
  )
}
