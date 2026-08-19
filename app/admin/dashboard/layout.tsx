import type { ReactNode } from 'react'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { adminLogout } from '@/app/actions/auth'
import { Container } from '@/components/ui/Container'
import { ToastProvider } from '@/components/ui/Toast'
import { Logo } from '@/components/ui/Logo'
import { AdminNav } from '@/components/admin/AdminNav'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Painel' },
  { href: '/admin/dashboard/cha-de-cozinha', label: 'Chá de Cozinha' },
  { href: '/admin/dashboard/casamento', label: 'Casamento' },
  { href: '/admin/dashboard/confirmacoes', label: 'Confirmações' },
  { href: '/admin/dashboard/reservas', label: 'Reservas' },
  { href: '/admin/dashboard/configuracoes', label: 'Configurações' },
] as const

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
          <Container className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
            <div className="flex items-center gap-4">
              <Logo variant="full" tone="light" height={28} priority />
              <span className="h-6 w-px bg-on-deep-soft/35" aria-hidden="true" />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent">Administrando</p>
                {/* h1 real da área admin — cada página de conteúdo usa h2 pra baixo
                    disso, então a hierarquia de heading fica correta em toda rota. */}
                <h1 className="font-display text-lg italic">{event.name}</h1>
              </div>
            </div>
            <nav aria-label="Seções do painel" className="flex items-center gap-2 sm:gap-4">
              <AdminNav items={NAV_ITEMS} />
              <form action={adminLogout} className="shrink-0">
                <button
                  type="submit"
                  className="flex min-h-11 items-center px-2 text-sm text-on-deep-soft underline decoration-on-deep-soft/40 underline-offset-2 transition-colors duration-[var(--duration-hover)] hover:text-on-deep"
                >
                  Sair
                </button>
              </form>
            </nav>
          </Container>
        </header>
        <main id="admin-main" className="flex-1 py-8 sm:py-10">
          <Container>{children}</Container>
        </main>
      </div>
    </ToastProvider>
  )
}
