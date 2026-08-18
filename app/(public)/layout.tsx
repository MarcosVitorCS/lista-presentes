import type { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-white">{children}</div>
}
