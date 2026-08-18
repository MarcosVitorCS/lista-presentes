import type { ReactNode } from 'react'
import Link from 'next/link'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { adminLogout } from '@/app/actions/auth'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Painel' },
  { href: '/admin/dashboard/cha-de-cozinha', label: 'Chá de Cozinha' },
  { href: '/admin/dashboard/casamento', label: 'Casamento' },
  { href: '/admin/dashboard/reservas', label: 'Reservas' },
  { href: '/admin/dashboard/configuracoes', label: 'Configurações' },
]

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Checagem REAL de sessão (redireciona para /admin/login se necessário) —
  // ver comentário em app/admin/layout.tsx sobre por que isso não fica lá.
  const event = await getAdminEvent()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-4 border-b border-zinc-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Administrando</p>
          <h1 className="text-lg font-semibold text-zinc-900">{event.name}</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-zinc-600 hover:text-zinc-900">
              {item.label}
            </Link>
          ))}
          <form action={adminLogout}>
            <button type="submit" className="text-sm text-zinc-500 underline">
              Sair
            </button>
          </form>
        </nav>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  )
}
