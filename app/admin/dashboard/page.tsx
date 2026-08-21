import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { getGiftStats, getFinancialStats, getRsvpStats, getEventTiming } from '@/lib/dal/dashboard-stats'
import { DashboardSummary } from '@/components/admin/DashboardSummary'
import { DashboardQuickActions } from '@/components/admin/DashboardQuickActions'
import { DashboardDetails } from '@/components/admin/DashboardDetails'

export default async function DashboardPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  // As 4 funções paralelizam suas próprias queries internamente — chamá-las
  // aqui dentro de um único Promise.all evita reintroduzir o waterfall que
  // esta página já evitava antes desta rodada (ver lib/dal/dashboard-stats.ts).
  const [gift, financial, rsvp, timing] = await Promise.all([
    getGiftStats(supabase, event.id),
    getFinancialStats(supabase, event.id),
    getRsvpStats(supabase, event.id),
    getEventTiming(supabase, event),
  ])

  const pendingPixCount = financial?.pendingCount ?? 0

  const sections = [
    {
      href: '/admin/dashboard/cha-de-cozinha',
      title: 'Chá de Cozinha',
      description: 'Cadastrar e editar itens físicos.',
      highlight: false,
    },
    {
      href: '/admin/dashboard/casamento',
      title: 'Casamento',
      description: 'Cadastrar e editar cotas.',
      highlight: false,
    },
    {
      href: '/admin/dashboard/confirmacoes',
      title: 'Confirmações',
      description: 'Convidados e confirmação de presença (RSVP).',
      highlight: false,
    },
    {
      href: '/admin/dashboard/reservas',
      title: 'Reservas',
      description: pendingPixCount
        ? `${pendingPixCount} PIX aguardando confirmação`
        : 'Confirmar e cancelar reservas.',
      highlight: Boolean(pendingPixCount),
    },
    {
      href: '/admin/dashboard/configuracoes',
      title: 'Configurações',
      description: event.pix_key
        ? 'Nome, data e chave PIX do evento.'
        : 'Chave PIX ainda não configurada — reservas via PIX ficam sem instrução de pagamento.',
      highlight: !event.pix_key,
    },
  ]

  return (
    <div className="flex flex-col gap-10">
      {/* Visível só pra leitor de tela: mantém a hierarquia h1 (layout) > h2
          sem duplicar visualmente o que o resumo abaixo já comunica. */}
      <h2 className="sr-only">Painel</h2>

      <DashboardSummary
        eventName={event.name}
        timing={timing}
        gift={gift}
        rsvp={rsvp}
        pendingPixCount={pendingPixCount}
      />

      <DashboardQuickActions eventSlug={event.slug} hasRsvp={rsvp != null} pendingPixCount={pendingPixCount} />

      <DashboardDetails financial={financial} topItems={gift.topItems} rsvp={rsvp} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          // group + a seta que desliza: o mesmo vocabulário de hover das
          // linhas de lista da home, pra que "isto navega" tenha um só sinal
          // no produto inteiro.
          <Link
            key={section.href}
            href={section.href}
            className={`group flex min-h-28 flex-col gap-1 rounded-[var(--radius-lg)] border p-5 transition-colors duration-[var(--duration-hover)] ${
              section.highlight
                ? 'border-warning/40 bg-warning-soft'
                : 'border-canvas-line bg-canvas hover:border-accent-strong'
            }`}
          >
            <span className="flex items-center gap-1.5 font-sans font-semibold text-ink">
              {section.title}
              <ArrowRight
                size={14}
                strokeWidth={1.8}
                className="text-accent-strong transition-transform duration-[var(--duration-hover)] ease-[var(--ease-out)] group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
            <span className="text-caption text-ink-soft">{section.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
