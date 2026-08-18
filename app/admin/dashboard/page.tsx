import Link from 'next/link'
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
        <Card className="flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-soft">Presentes reservados</span>
            <span className="font-display text-2xl text-ink">{reservedPct}%</span>
          </div>
          <Progress value={reservedPct} />
          <div className="grid grid-cols-3 gap-3 border-t border-canvas-line pt-5 sm:gap-4">
            <Stat label="Confirmados" value={confirmedCount ?? 0} />
            <Stat label="PIX pendente" value={pendingCount ?? 0} warn={Boolean(pendingCount)} />
            <Stat label="Disponíveis" value={availableUnits} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={`flex flex-col gap-1 rounded-[var(--radius)] border p-5 transition-colors ${
              section.highlight
                ? 'border-warning/40 bg-warning-soft'
                : 'border-canvas-line bg-canvas hover:border-accent-strong'
            }`}
          >
            <span className="font-sans font-semibold text-ink">{section.title}</span>
            <span className="text-sm text-ink-soft">{section.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, warn = false }: { label: string; value: number; warn?: boolean }) {
  return (
    // min-w-0 é o que impede o rótulo de "PIX pendente" de vazar pra fora da
    // coluna do grid em telas estreitas (grid items têm min-width:auto por
    // padrão, o que ignora a largura da track ao decidir quebrar linha).
    <div className="min-w-0">
      <p className={`font-display text-2xl ${warn ? 'text-warning' : 'text-ink'}`}>{value}</p>
      {/* break-words é rede de segurança: "CONFIRMADOS" é uma palavra só, sem
          espaço pra quebrar — sem isso ela estoura a coluna em telas
          estreitas em vez de quebrar linha (diferente de "PIX PENDENTE",
          que tem onde quebrar). O tamanho/tracking menores no mobile evitam
          que a quebra seja sequer necessária na maioria dos casos. */}
      <p className="mt-0.5 break-words text-[10px] uppercase leading-snug tracking-[0.03em] text-ink-soft sm:text-xs sm:tracking-[0.08em]">
        {label}
      </p>
    </div>
  )
}
