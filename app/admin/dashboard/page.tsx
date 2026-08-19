import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'
import { Eyebrow } from '@/components/ui/Heading'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'

export default async function DashboardPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const [{ data: items }, { count: pendingCount }, { count: confirmedCount }] = await Promise.all([
    supabase.from('gift_items').select('quantity_total, quantity_reserved').eq('event_id', event.id),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'pending'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('event_id', event.id).eq('status', 'confirmed'),
  ])

  const totalUnits = (items ?? []).reduce((sum, item) => sum + item.quantity_total, 0)
  const reservedUnits = (items ?? []).reduce((sum, item) => sum + item.quantity_reserved, 0)
  const availableUnits = totalUnits - reservedUnits
  const reservedPct = totalUnits > 0 ? Math.round((reservedUnits / totalUnits) * 100) : 0

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
      description: pendingCount
        ? `${pendingCount} PIX aguardando confirmação`
        : 'Confirmar e cancelar reservas.',
      highlight: Boolean(pendingCount),
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
          sem duplicar visualmente o que "Visão geral" já comunica. */}
      <h2 className="sr-only">Painel</h2>
      <div className="flex flex-col gap-4">
        <Eyebrow>Visão geral</Eyebrow>
        <Card elevation="raise" className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <span className="text-caption text-ink-soft">Presentes reservados</span>
            <span className="font-display text-display-md leading-none text-ink-deep">
              {reservedPct}%
            </span>
          </div>
          <Progress value={reservedPct} label="Presentes reservados" />
          <div className="grid grid-cols-3 gap-3 border-t border-canvas-line pt-5 sm:gap-4">
            <Stat label="Confirmados" value={confirmedCount ?? 0} />
            <Stat label="PIX pendente" value={pendingCount ?? 0} warn={Boolean(pendingCount)} />
            <Stat label="Disponíveis" value={availableUnits} />
          </div>
        </Card>
      </div>

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

/**
 * Stat local, e não o `Stat` do kit, de propósito: este rótulo precisa de
 * `break-words` e de um tamanho menor no mobile — "CONFIRMADOS" é uma palavra
 * só, sem espaço pra quebrar, e estoura a coluna do grid em 390px. O Stat do
 * kit resolve o caso geral (hero, cartões largos); este resolve o caso de três
 * colunas em tela estreita.
 */
function Stat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    // min-w-0 é o que impede o rótulo de "PIX pendente" de vazar pra fora da
    // coluna do grid em telas estreitas (grid items têm min-width:auto por
    // padrão, o que ignora a largura da track ao decidir quebrar linha).
    <div className="min-w-0">
      <p
        className={`font-display text-display-md leading-none ${warn ? 'text-warning' : 'text-ink-deep'}`}
      >
        {value}
      </p>
      <p className="mt-1 break-words text-[10px] uppercase leading-snug tracking-[0.03em] text-ink-soft sm:text-xs sm:tracking-[0.08em]">
        {label}
      </p>
    </div>
  )
}
