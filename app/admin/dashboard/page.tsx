import Link from 'next/link'
import { getAdminEvent } from '@/lib/dal/admin-session'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const event = await getAdminEvent()
  const supabase = await createClient()

  const { count: pendingCount } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)
    .eq('status', 'pending')

  const cards = [
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
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-500">Visão geral</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`flex flex-col gap-1 rounded-lg border p-5 transition-colors ${
              card.highlight
                ? 'border-amber-300 bg-amber-50'
                : 'border-zinc-200 hover:border-zinc-400'
            }`}
          >
            <span className="font-medium text-zinc-900">{card.title}</span>
            <span className="text-sm text-zinc-600">{card.description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
