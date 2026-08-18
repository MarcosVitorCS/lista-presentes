import type { ReactNode } from 'react'
import Link from 'next/link'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { adminLogout } from '@/app/actions/auth'
import { Container } from '@/components/ui/Container'
import { ToastProvider } from '@/components/ui/Toast'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Painel' },
  { href: '/admin/dashboard/cha-de-cozinha', label: 'Chá de Cozinha' },
  { href: '/admin/dashboard/casamento', label: 'Casamento' },
  { href: '/admin/dashboard/confirmacoes', label: 'Confirmações' },
  { href: '/admin/dashboard/reservas', label: 'Reservas' },
  { href: '/admin/dashboard/configuracoes', label: 'Configurações' },
]

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Checagem REAL de sessão (redireciona para /admin/login se necessário) —
  // ver comentário em app/admin/layout.tsx sobre por que isso não fica lá.
  const event = await getAdminEvent()

  return (
    <ToastProvider>
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[var(--radius)] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-deep"
      >
        Pular para o conteúdo
      </a>
      <header className="bg-ink-deep text-on-deep">
        <Container className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-accent">Administrando</p>
            {/* h1 real da área admin — cada página de conteúdo usa h2 pra baixo
                disso, então a hierarquia de heading fica correta em toda rota. */}
            <h1 className="font-display text-lg italic">{event.name}</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="text-on-deep-soft transition-colors hover:text-on-deep">
                {item.label}
              </Link>
            ))}
            <form action={adminLogout}>
              <button type="submit" className="text-on-deep-soft underline decoration-on-deep-soft/40 underline-offset-2 transition-colors hover:text-on-deep">
                Sair
              </button>
            </form>
          </nav>
        </Container>
      </header>
      <main id="admin-main" className="flex-1 py-10">
        <Container>{children}</Container>
      </main>
    </div>
    </ToastProvider>
  )
}
