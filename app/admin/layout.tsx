import type { ReactNode } from 'react'

// Shell fino de propósito: NÃO faz a checagem de sessão aqui, porque também
// engloba /admin/login. A checagem real (verifyAdminSession/getAdminEvent)
// fica em app/admin/dashboard/layout.tsx — colocá-la aqui criaria um
// redirect de /admin/login para /admin/login quando deslogado.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-canvas">{children}</div>
}
